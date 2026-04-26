package com.devbuild.gestion_charite.controller;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.devbuild.gestion_charite.entity.User;
import com.devbuild.gestion_charite.entity.enums.Role;
import com.devbuild.gestion_charite.repository.UserRepository;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
	private static final Logger LOGGER = LoggerFactory.getLogger(AuthController.class);

	private static final String GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
	private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
	private static final String GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
	private static final String GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

	private final UserRepository userRepository;
	private final ObjectMapper objectMapper;

	@Value("${app.oauth.google.client-id:}")
	private String googleClientId;

	@Value("${app.oauth.google.client-secret:}")
	private String googleClientSecret;

	@Value("${app.oauth.google.redirect-uri:http://localhost:8080/api/auth/google/callback}")
	private String googleRedirectUri;

	@Value("${app.frontend-url:http://localhost:5173}")
	private String frontendUrl;

	public AuthController(UserRepository userRepository, ObjectMapper objectMapper) {
		this.userRepository = userRepository;
		this.objectMapper = objectMapper;
	}

	@GetMapping("/ping")
	public Map<String, String> ping() {
		return Map.of("message", "Auth API is reachable");
	}

	@GetMapping("/google/start")
	public ResponseEntity<?> startGoogleLogin() {
		if (googleClientId == null || googleClientId.isBlank() || googleClientSecret == null || googleClientSecret.isBlank()) {
			LOGGER.warn("Google OAuth start requested but credentials are missing");
			return ResponseEntity.status(302)
					.location(URI.create(frontendUrl + "?google_error=" + urlEncode("oauth_not_configured")))
					.build();
		}

		String authUrl = GOOGLE_AUTH_URL
				+ "?client_id=" + urlEncode(googleClientId)
				+ "&redirect_uri=" + urlEncode(googleRedirectUri)
				+ "&response_type=code"
				+ "&scope=" + urlEncode("openid email profile")
				+ "&access_type=online"
				+ "&prompt=select_account";

		return ResponseEntity.status(302).location(URI.create(authUrl)).build();
	}

	@GetMapping("/google/config")
	public Map<String, Object> googleConfigStatus() {
		boolean configured = googleClientId != null && !googleClientId.isBlank()
				&& googleClientSecret != null && !googleClientSecret.isBlank();
		return Map.of(
				"configured", configured,
				"redirectUri", googleRedirectUri,
				"requiresClientSecret", true
		);
	}

	@GetMapping("/google/callback")
	public ResponseEntity<?> googleCallback(
			@RequestParam(name = "code", required = false) String code,
			@RequestParam(name = "error", required = false) String error,
			@RequestParam(name = "error_description", required = false) String errorDescription) {
		if (error != null && !error.isBlank()) {
			LOGGER.warn("Google OAuth callback returned error: {} ({})", error, errorDescription);
			return ResponseEntity.status(302)
					.location(URI.create(frontendUrl + "?google_error=" + urlEncode(error)))
					.build();
		}

		if (code == null || code.isBlank()) {
			return ResponseEntity.status(302)
					.location(URI.create(frontendUrl + "?google_error=missing_code"))
					.build();
		}

		try {
			Map<String, Object> tokenPayload = exchangeCodeForToken(code);
			String accessToken = asString(tokenPayload.get("access_token"));

			if (accessToken == null || accessToken.isBlank()) {
				return ResponseEntity.status(302)
						.location(URI.create(frontendUrl + "?google_error=missing_access_token"))
						.build();
			}

			Map<String, Object> profile = fetchGoogleProfile(accessToken);
			String sub = asString(profile.get("sub"));
			String email = asString(profile.get("email"));
			String name = asString(profile.get("name"));

			if (sub == null || sub.isBlank() || email == null || email.isBlank()) {
				return ResponseEntity.status(302)
						.location(URI.create(frontendUrl + "?google_error=invalid_profile"))
						.build();
			}

			String redirect = frontendUrl
					+ "?google_sub=" + urlEncode(sub)
					+ "&google_email=" + urlEncode(email)
					+ "&google_name=" + urlEncode(name == null ? "Google User" : name);

			return ResponseEntity.status(302).location(URI.create(redirect)).build();
		} catch (Exception ex) {
			String reason = "oauth_failed";
			String msg = ex.getMessage() == null ? "" : ex.getMessage().toLowerCase(Locale.ROOT);
			if (msg.contains("invalid_client")) {
				reason = "oauth_invalid_client";
			} else if (msg.contains("redirect_uri_mismatch")) {
				reason = "oauth_redirect_mismatch";
			} else if (msg.contains("invalid_grant")) {
				reason = "oauth_invalid_grant";
			} else if (msg.contains("non configure") || msg.contains("not configured")) {
				reason = "oauth_not_configured";
			}

			if ("oauth_failed".equals(reason)) {
				LOGGER.error("Google OAuth callback failed", ex);
			} else {
				LOGGER.warn("Google OAuth callback failed with reason: {}", reason);
			}

			return ResponseEntity.status(302)
					.location(URI.create(frontendUrl + "?google_error=" + urlEncode(reason)))
					.build();
		}
	}

	@PostMapping("/register")
	public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
		if (request.email() == null || request.email().isBlank() || request.password() == null || request.password().isBlank()
				|| request.fullName() == null || request.fullName().isBlank()) {
			return ResponseEntity.badRequest().body(Map.of("error", "fullName, email et password sont obligatoires"));
		}

		if (userRepository.existsByEmail(request.email())) {
			return ResponseEntity.badRequest().body(Map.of("error", "Un compte existe deja avec cet email"));
		}

		User user = new User();
		user.setFullName(request.fullName());
		user.setEmail(request.email());
		user.setPasswordHash(hashPassword(request.password()));
		user.setPhone(request.phone());
		user.setAddress(request.address());
		user.setPreferredLanguage(request.preferredLanguage() == null ? "fr" : request.preferredLanguage());
		user.setInterests(request.interests());
		user.setRole(request.role() == null ? Role.DONOR : request.role());

		User saved = userRepository.save(user);
		return ResponseEntity.ok(Map.of(
				"id", saved.getId(),
				"fullName", saved.getFullName(),
				"email", saved.getEmail(),
				"role", saved.getRole().name(),
				"preferredLanguage", saved.getPreferredLanguage()
		));
	}

	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody LoginRequest request) {
		Optional<User> optionalUser = userRepository.findByEmail(request.email());
		if (optionalUser.isEmpty()) {
			return ResponseEntity.status(401).body(Map.of("error", "Identifiants invalides"));
		}

		User user = optionalUser.get();
		String incomingPasswordHash = hashPassword(request.password());
		if (!incomingPasswordHash.equals(user.getPasswordHash())) {
			return ResponseEntity.status(401).body(Map.of("error", "Identifiants invalides"));
		}

		return ResponseEntity.ok(Map.of(
				"message", "Connexion reussie",
				"userId", user.getId(),
				"email", user.getEmail(),
				"role", user.getRole().name()
		));
	}

	@PostMapping("/google")
	public ResponseEntity<?> loginWithGoogle(@RequestBody GoogleAuthRequest request) {
		GoogleIdentity identity;
		if (request.idToken() != null && !request.idToken().isBlank()) {
			try {
				identity = verifyGoogleIdToken(request.idToken());
			} catch (Exception ex) {
				LOGGER.warn("Google id_token validation failed: {}", ex.getMessage());
				return ResponseEntity.status(401).body(Map.of("error", "Google id_token invalide"));
			}
		} else {
			if (request.googleSubject() == null || request.googleSubject().isBlank() || request.email() == null || request.email().isBlank()) {
				return ResponseEntity.badRequest().body(Map.of("error", "idToken ou (googleSubject et email) sont obligatoires"));
			}
			identity = new GoogleIdentity(
					request.googleSubject(),
					request.email(),
					request.fullName() == null || request.fullName().isBlank() ? "Utilisateur Google" : request.fullName()
			);
		}

		User user = userRepository.findByGoogleSubject(identity.googleSubject())
				.orElseGet(() -> userRepository.findByEmail(identity.email()).orElse(null));

		if (user == null) {
			user = new User();
			user.setFullName(identity.fullName());
			user.setEmail(identity.email());
			user.setPasswordHash(hashPassword("google-oauth-placeholder"));
			user.setPreferredLanguage("fr");
			user.setRole(Role.DONOR);
		} else if ((user.getFullName() == null || user.getFullName().isBlank()) && identity.fullName() != null) {
			user.setFullName(identity.fullName());
		}

		user.setGoogleSubject(identity.googleSubject());
		User saved = userRepository.save(user);
		return ResponseEntity.ok(Map.of(
				"message", "Connexion Google reussie",
				"userId", saved.getId(),
				"email", saved.getEmail(),
				"role", saved.getRole().name()
		));
	}

	private String hashPassword(String password) {
		if (password == null) {
			return "";
		}
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hashBytes = digest.digest(password.getBytes(StandardCharsets.UTF_8));
			return Base64.getEncoder().encodeToString(hashBytes);
		} catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 indisponible", ex);
		}
	}

	private Map<String, Object> exchangeCodeForToken(String code) throws IOException, InterruptedException {
		if (googleClientId == null || googleClientId.isBlank() || googleClientSecret == null || googleClientSecret.isBlank()) {
			throw new IllegalStateException("Google OAuth non configure");
		}

		String formBody = "code=" + urlEncode(code)
				+ "&client_id=" + urlEncode(googleClientId)
				+ "&client_secret=" + urlEncode(googleClientSecret)
				+ "&redirect_uri=" + urlEncode(googleRedirectUri)
				+ "&grant_type=authorization_code";

		HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(GOOGLE_TOKEN_URL))
				.header("Content-Type", "application/x-www-form-urlencoded")
				.POST(HttpRequest.BodyPublishers.ofString(formBody))
				.build();

		HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
		if (response.statusCode() < 200 || response.statusCode() >= 300) {
			throw new IllegalStateException("Echec token Google: " + response.statusCode() + " - " + response.body());
		}

		return objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {
		});
	}

	private Map<String, Object> fetchGoogleProfile(String accessToken) throws IOException, InterruptedException {
		HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(GOOGLE_USERINFO_URL))
				.header("Authorization", "Bearer " + accessToken)
				.GET()
				.build();

		HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
		if (response.statusCode() < 200 || response.statusCode() >= 300) {
			throw new IllegalStateException("Echec profil Google: " + response.statusCode());
		}

		return objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {
		});
	}

	private GoogleIdentity verifyGoogleIdToken(String idToken) throws IOException, InterruptedException {
		String uri = GOOGLE_TOKENINFO_URL + "?id_token=" + urlEncode(idToken);
		HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(uri))
				.GET()
				.build();

		HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
		if (response.statusCode() < 200 || response.statusCode() >= 300) {
			throw new IllegalStateException("Echec verification token Google: " + response.statusCode());
		}

		Map<String, Object> payload = objectMapper.readValue(response.body(), new TypeReference<Map<String, Object>>() {
		});
		String sub = asString(payload.get("sub"));
		String email = asString(payload.get("email"));
		String name = asString(payload.get("name"));
		String aud = asString(payload.get("aud"));
		String emailVerified = asString(payload.get("email_verified"));

		if (sub == null || sub.isBlank() || email == null || email.isBlank()) {
			throw new IllegalStateException("Claims Google incomplets");
		}
		if (googleClientId != null && !googleClientId.isBlank() && (aud == null || !googleClientId.equals(aud))) {
			throw new IllegalStateException("Audience id_token invalide");
		}
		if (emailVerified != null && "false".equalsIgnoreCase(emailVerified)) {
			throw new IllegalStateException("Email Google non verifie");
		}

		return new GoogleIdentity(
				sub,
				email,
				(name == null || name.isBlank()) ? "Utilisateur Google" : name
		);
	}

	private static String urlEncode(String value) {
		if (value == null) {
			return "";
		}
		return URLEncoder.encode(value, StandardCharsets.UTF_8);
	}

	private static String asString(Object value) {
		return value == null ? null : String.valueOf(value);
	}

	public record RegisterRequest(
			String fullName,
			String email,
			String password,
			String phone,
			String address,
			String preferredLanguage,
			String interests,
			Role role
	) {
	}

	public record LoginRequest(String email, String password) {
	}

	private record GoogleIdentity(String googleSubject, String email, String fullName) {
	}

	public record GoogleAuthRequest(String googleSubject, String email, String fullName, String idToken) {
	}
}
