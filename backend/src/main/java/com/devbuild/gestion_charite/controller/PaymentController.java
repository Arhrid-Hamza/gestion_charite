package com.devbuild.gestion_charite.controller;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.devbuild.gestion_charite.entity.Donation;
import com.devbuild.gestion_charite.entity.enums.PaymentMethod;
import com.devbuild.gestion_charite.service.DonationProcessingService;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

	private static final HttpClient HTTP_CLIENT = HttpClient.newHttpClient();

	private final ObjectMapper objectMapper;
	private final DonationProcessingService donationProcessingService;

	@Value("${app.frontend-url:http://localhost:5174}")
	private String frontendUrl;

	@Value("${app.paypal.base-url:https://api-m.sandbox.paypal.com}")
	private String paypalBaseUrl;

	@Value("${app.paypal.client-id:}")
	private String paypalClientId;

	@Value("${app.paypal.client-secret:}")
	private String paypalClientSecret;

	@Value("${app.stripe.base-url:https://api.stripe.com}")
	private String stripeBaseUrl;

	@Value("${app.stripe.secret-key:}")
	private String stripeSecretKey;

	public PaymentController(ObjectMapper objectMapper, DonationProcessingService donationProcessingService) {
		this.objectMapper = objectMapper;
		this.donationProcessingService = donationProcessingService;
	}

	@PostMapping("/paypal/create-order")
	public ResponseEntity<?> createPaypalOrder(@RequestBody PaymentRequest request) {
		if (paypalClientId == null || paypalClientId.isBlank() || paypalClientSecret == null || paypalClientSecret.isBlank()) {
			return ResponseEntity.status(500).body(Map.of("error", "PayPal credentials are not configured"));
		}
		if (!isValidRequest(request)) {
			return ResponseEntity.badRequest().body(Map.of("error", "Invalid payment request"));
		}

		try {
			String accessToken = getPaypalAccessToken();

			Map<String, Object> payload = Map.of(
					"intent", "CAPTURE",
					"purchase_units", List.of(Map.of(
							"amount", Map.of(
									"currency_code", "USD",
									"value", normalizedAmount(request.amount())
							),
							"description", request.message() == null ? "Donation" : request.message(),
							"custom_id", request.actionId() + ":" + request.donorUserId()
					)),
					"application_context", Map.of(
							"return_url", frontendUrl + "?payment=paypal-success",
							"cancel_url", frontendUrl + "?payment=paypal-cancel"
					)
			);

			HttpRequest httpRequest = HttpRequest.newBuilder()
					.uri(URI.create(paypalBaseUrl + "/v2/checkout/orders"))
					.header("Content-Type", "application/json")
					.header("Authorization", "Bearer " + accessToken)
					.POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
					.build();

			HttpResponse<String> response = HTTP_CLIENT.send(httpRequest, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() < 200 || response.statusCode() >= 300) {
				return ResponseEntity.status(502).body(Map.of("error", "Failed to create PayPal order", "details", response.body()));
			}

			Map<String, Object> body = parseJson(response.body());
			String orderId = asString(body.get("id"));
			String approveUrl = extractPaypalApproveUrl(body);
			if (orderId == null || approveUrl == null) {
				return ResponseEntity.status(502).body(Map.of("error", "Invalid PayPal response"));
			}

			return ResponseEntity.ok(Map.of(
					"provider", "PAYPAL",
					"orderId", orderId,
					"approveUrl", approveUrl
			));
		} catch (Exception ex) {
			return ResponseEntity.status(500).body(Map.of("error", "PayPal order creation failed", "details", ex.getMessage()));
		}
	}

	private String normalizedAmount(BigDecimal amount) {
		if (amount == null) {
			throw new IllegalArgumentException("amount is required");
		}
		return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
	}

	@PostMapping("/paypal/capture/{orderId}")
	public ResponseEntity<?> capturePaypalOrder(@PathVariable String orderId, @RequestBody PaymentRequest request) {
		if (paypalClientId == null || paypalClientId.isBlank() || paypalClientSecret == null || paypalClientSecret.isBlank()) {
			return ResponseEntity.status(500).body(Map.of("error", "PayPal credentials are not configured"));
		}
		if (!isValidRequest(request) || orderId == null || orderId.isBlank()) {
			return ResponseEntity.badRequest().body(Map.of("error", "Invalid capture request"));
		}

		try {
			String accessToken = getPaypalAccessToken();

			HttpRequest captureRequest = HttpRequest.newBuilder()
					.uri(URI.create(paypalBaseUrl + "/v2/checkout/orders/" + urlEncode(orderId) + "/capture"))
					.header("Content-Type", "application/json")
					.header("Authorization", "Bearer " + accessToken)
					.POST(HttpRequest.BodyPublishers.ofString("{}"))
					.build();

			HttpResponse<String> response = HTTP_CLIENT.send(captureRequest, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() < 200 || response.statusCode() >= 300) {
				return ResponseEntity.status(502).body(Map.of("error", "Failed to capture PayPal order", "details", response.body()));
			}

			Map<String, Object> payload = parseJson(response.body());
			String status = asString(payload.get("status"));
			if (status == null || !status.equalsIgnoreCase("COMPLETED")) {
				return ResponseEntity.status(400).body(Map.of("error", "PayPal order is not completed"));
			}

			String transactionId = extractPaypalCaptureId(payload);
			Donation donation = donationProcessingService.createConfirmedDonation(
					request.actionId(),
					request.donorUserId(),
					request.amount(),
					request.message(),
					PaymentMethod.PAYPAL,
					transactionId == null ? orderId : transactionId
			);

			return ResponseEntity.ok(Map.of(
					"provider", "PAYPAL",
					"donation", donation
			));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
		} catch (Exception ex) {
			return ResponseEntity.status(500).body(Map.of("error", "PayPal capture failed", "details", ex.getMessage()));
		}
	}

	@PostMapping("/stripe/create-checkout-session")
	public ResponseEntity<?> createStripeCheckoutSession(@RequestBody PaymentRequest request) {
		if (stripeSecretKey == null || stripeSecretKey.isBlank()) {
			return ResponseEntity.status(500).body(Map.of("error", "Stripe secret key is not configured"));
		}
		if (!isValidRequest(request)) {
			return ResponseEntity.badRequest().body(Map.of("error", "Invalid payment request"));
		}

		try {
			long cents = request.amount().multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();
			if (cents <= 0) {
				return ResponseEntity.badRequest().body(Map.of("error", "Amount must be greater than zero"));
			}

			String formBody = "mode=payment"
					+ "&success_url=" + urlEncode(frontendUrl + "?payment=stripe-success&session_id={CHECKOUT_SESSION_ID}")
					+ "&cancel_url=" + urlEncode(frontendUrl + "?payment=stripe-cancel")
					+ "&line_items[0][price_data][currency]=usd"
					+ "&line_items[0][price_data][product_data][name]=" + urlEncode("Donation")
					+ "&line_items[0][price_data][unit_amount]=" + cents
					+ "&line_items[0][quantity]=1"
					+ "&metadata[actionId]=" + request.actionId()
					+ "&metadata[donorUserId]=" + request.donorUserId()
					+ "&metadata[amount]=" + urlEncode(request.amount().toPlainString())
					+ "&metadata[message]=" + urlEncode(request.message() == null ? "" : request.message());

			HttpRequest sessionRequest = HttpRequest.newBuilder()
					.uri(URI.create(stripeBaseUrl + "/v1/checkout/sessions"))
					.header("Content-Type", "application/x-www-form-urlencoded")
					.header("Authorization", "Bearer " + stripeSecretKey)
					.POST(HttpRequest.BodyPublishers.ofString(formBody))
					.build();

			HttpResponse<String> response = HTTP_CLIENT.send(sessionRequest, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() < 200 || response.statusCode() >= 300) {
				return ResponseEntity.status(502).body(Map.of("error", "Failed to create Stripe session", "details", response.body()));
			}

			Map<String, Object> body = parseJson(response.body());
			String sessionId = asString(body.get("id"));
			String checkoutUrl = asString(body.get("url"));
			if (sessionId == null || checkoutUrl == null) {
				return ResponseEntity.status(502).body(Map.of("error", "Invalid Stripe response"));
			}

			return ResponseEntity.ok(Map.of(
					"provider", "STRIPE",
					"sessionId", sessionId,
					"checkoutUrl", checkoutUrl
			));
		} catch (Exception ex) {
			return ResponseEntity.status(500).body(Map.of("error", "Stripe session creation failed", "details", ex.getMessage()));
		}
	}

	@PostMapping("/stripe/confirm-session")
	public ResponseEntity<?> confirmStripeSession(@RequestParam String sessionId) {
		if (stripeSecretKey == null || stripeSecretKey.isBlank()) {
			return ResponseEntity.status(500).body(Map.of("error", "Stripe secret key is not configured"));
		}
		if (sessionId == null || sessionId.isBlank()) {
			return ResponseEntity.badRequest().body(Map.of("error", "Missing sessionId"));
		}

		try {
			HttpRequest request = HttpRequest.newBuilder()
					.uri(URI.create(stripeBaseUrl + "/v1/checkout/sessions/" + urlEncode(sessionId)))
					.header("Authorization", "Bearer " + stripeSecretKey)
					.GET()
					.build();

			HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() < 200 || response.statusCode() >= 300) {
				return ResponseEntity.status(502).body(Map.of("error", "Failed to fetch Stripe session", "details", response.body()));
			}

			Map<String, Object> payload = parseJson(response.body());
			String paymentStatus = asString(payload.get("payment_status"));
			if (paymentStatus == null || !paymentStatus.equalsIgnoreCase("paid")) {
				return ResponseEntity.status(400).body(Map.of("error", "Stripe session is not paid"));
			}

			@SuppressWarnings("unchecked")
			Map<String, Object> metadata = (Map<String, Object>) payload.get("metadata");
			if (metadata == null) {
				return ResponseEntity.status(400).body(Map.of("error", "Missing Stripe metadata"));
			}

			Long actionId = parseLong(metadata.get("actionId"));
			Long donorUserId = parseLong(metadata.get("donorUserId"));
			BigDecimal amount = parseBigDecimal(metadata.get("amount"));
			String message = asString(metadata.get("message"));
			String transactionId = asString(payload.get("payment_intent"));
			if (transactionId == null || transactionId.isBlank()) {
				transactionId = sessionId;
			}

			Donation donation = donationProcessingService.createConfirmedDonation(
					actionId,
					donorUserId,
					amount,
					message,
					PaymentMethod.STRIPE,
					transactionId
			);

			return ResponseEntity.ok(Map.of(
					"provider", "STRIPE",
					"donation", donation
			));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
		} catch (Exception ex) {
			return ResponseEntity.status(500).body(Map.of("error", "Stripe confirmation failed", "details", ex.getMessage()));
		}
	}

	private String getPaypalAccessToken() throws IOException, InterruptedException {
		String credentials = paypalClientId + ":" + paypalClientSecret;
		String basic = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

		HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(paypalBaseUrl + "/v1/oauth2/token"))
				.header("Authorization", "Basic " + basic)
				.header("Content-Type", "application/x-www-form-urlencoded")
				.POST(HttpRequest.BodyPublishers.ofString("grant_type=client_credentials"))
				.build();

		HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
		if (response.statusCode() < 200 || response.statusCode() >= 300) {
			throw new IllegalStateException("PayPal auth failed: " + response.body());
		}

		Map<String, Object> payload = parseJson(response.body());
		String accessToken = asString(payload.get("access_token"));
		if (accessToken == null || accessToken.isBlank()) {
			throw new IllegalStateException("Missing PayPal access token");
		}
		return accessToken;
	}

	private String extractPaypalApproveUrl(Map<String, Object> payload) {
		Object linksValue = payload.get("links");
		if (!(linksValue instanceof List<?> links)) {
			return null;
		}

		for (Object item : links) {
			if (!(item instanceof Map<?, ?> link)) {
				continue;
			}
			Object relValue = link.get("rel");
			if (relValue != null && "approve".equalsIgnoreCase(String.valueOf(relValue))) {
				Object hrefValue = link.get("href");
				return hrefValue == null ? null : String.valueOf(hrefValue);
			}
		}
		return null;
	}

	private String extractPaypalCaptureId(Map<String, Object> payload) {
		Object purchaseUnitsValue = payload.get("purchase_units");
		if (!(purchaseUnitsValue instanceof List<?> purchaseUnits) || purchaseUnits.isEmpty()) {
			return null;
		}
		Object firstUnitValue = purchaseUnits.get(0);
		if (!(firstUnitValue instanceof Map<?, ?> firstUnit)) {
			return null;
		}
		Object paymentsValue = firstUnit.get("payments");
		if (!(paymentsValue instanceof Map<?, ?> payments)) {
			return null;
		}
		Object capturesValue = payments.get("captures");
		if (!(capturesValue instanceof List<?> captures) || captures.isEmpty()) {
			return null;
		}
		Object firstCaptureValue = captures.get(0);
		if (!(firstCaptureValue instanceof Map<?, ?> firstCapture)) {
			return null;
		}
		Object idValue = firstCapture.get("id");
		return idValue == null ? null : String.valueOf(idValue);
	}

	private boolean isValidRequest(PaymentRequest request) {
		return request != null
				&& request.actionId() != null
				&& request.donorUserId() != null
				&& request.amount() != null
				&& request.amount().compareTo(BigDecimal.ZERO) > 0;
	}

	private Map<String, Object> parseJson(String body) throws IOException {
		return objectMapper.readValue(body, new TypeReference<Map<String, Object>>() {
		});
	}

	private static String asString(Object value) {
		return value == null ? null : String.valueOf(value);
	}

	private static String urlEncode(String value) {
		if (value == null) {
			return "";
		}
		return URLEncoder.encode(value, StandardCharsets.UTF_8);
	}

	private static Long parseLong(Object value) {
		if (value == null) {
			return null;
		}
		if (value instanceof Number number) {
			return number.longValue();
		}
		String text = String.valueOf(value);
		if (text.isBlank()) {
			return null;
		}
		return Long.parseLong(text);
	}

	private static BigDecimal parseBigDecimal(Object value) {
		if (value == null) {
			return null;
		}
		if (value instanceof BigDecimal bigDecimal) {
			return bigDecimal;
		}
		if (value instanceof Number number) {
			return BigDecimal.valueOf(number.doubleValue());
		}
		String text = String.valueOf(value);
		if (text.isBlank()) {
			return null;
		}
		return new BigDecimal(text);
	}

	public record PaymentRequest(
			Long actionId,
			Long donorUserId,
			BigDecimal amount,
			String message
	) {
	}
}
