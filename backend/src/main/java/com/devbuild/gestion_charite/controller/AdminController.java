package com.devbuild.gestion_charite.controller;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.devbuild.gestion_charite.entity.Donation;
import com.devbuild.gestion_charite.entity.Organization;
import com.devbuild.gestion_charite.entity.User;
import com.devbuild.gestion_charite.entity.enums.OrganizationStatus;
import com.devbuild.gestion_charite.repository.CharityActionRepository;
import com.devbuild.gestion_charite.repository.DonationRepository;
import com.devbuild.gestion_charite.repository.OrganizationRepository;
import com.devbuild.gestion_charite.repository.UserRepository;

import jakarta.servlet.http.HttpSession;

@Controller
@RequestMapping("/admin")
public class AdminController {

	// -----------------------------------------------------------------------
	// Hardcoded admin credentials
	// -----------------------------------------------------------------------
	private static final String ADMIN_EMAIL        = "admin@gestion-charite.local";
	private static final String ADMIN_PASSWORD  = "ADMIN123456";

	private final UserRepository         userRepository;
	private final OrganizationRepository organizationRepository;
	private final CharityActionRepository charityActionRepository;
	private final DonationRepository     donationRepository;

	public AdminController(
			UserRepository userRepository,
			OrganizationRepository organizationRepository,
			CharityActionRepository charityActionRepository,
			DonationRepository donationRepository) {
		this.userRepository          = userRepository;
		this.organizationRepository  = organizationRepository;
		this.charityActionRepository = charityActionRepository;
		this.donationRepository      = donationRepository;
	}

	// -----------------------------------------------------------------------
	// Login page (GET)
	// -----------------------------------------------------------------------
	@GetMapping("/login")
	public String loginPage(HttpSession session, Model model) {
		if (Boolean.TRUE.equals(session.getAttribute("adminLoggedIn"))) {
			return "redirect:/admin";
		}
		return "admin-login";
	}

	// -----------------------------------------------------------------------
	// Login form submit (POST)
	// -----------------------------------------------------------------------
	@PostMapping("/login")
	public String processLogin(
			@RequestParam String email,
			@RequestParam String password,
			HttpSession session,
			RedirectAttributes redirectAttributes) {

		boolean emailOk    = ADMIN_EMAIL.equalsIgnoreCase(email);
		boolean passwordOk = ADMIN_PASSWORD.equals(password);

		if (emailOk && passwordOk) {
			session.setAttribute("adminLoggedIn", Boolean.TRUE);
			return "redirect:/admin";
		}

		redirectAttributes.addFlashAttribute("loginError", "Email ou mot de passe incorrect.");
		return "redirect:/admin/login";
	}

	// -----------------------------------------------------------------------
	// Logout
	// -----------------------------------------------------------------------
	@GetMapping("/logout")
	public String logout(HttpSession session) {
		session.invalidate();
		return "redirect:http://localhost:5173";
	}

	// -----------------------------------------------------------------------
	// Dashboard (GET /admin)
	// -----------------------------------------------------------------------
	@GetMapping
	public String adminPage(HttpSession session, Model model) {
		// Guard – must be logged in
		if (!Boolean.TRUE.equals(session.getAttribute("adminLoggedIn"))) {
			return "redirect:/admin/login";
		}

		// --- Pending organisations ---
		List<Organization> pendingOrgs =
				organizationRepository.findByStatus(OrganizationStatus.PENDING);
		model.addAttribute("organizations", pendingOrgs);

		// --- Dashboard stats ---
		long totalUsers         = userRepository.count();
		long totalOrgs          = organizationRepository.count();
		long approvedOrgs       = organizationRepository.findByStatus(OrganizationStatus.APPROVED).size();
		long pendingOrgsCount   = pendingOrgs.size();
		long totalActions       = charityActionRepository.count();
		List<Donation> allDonations = donationRepository.findAll();
		long   totalDonationsCount  = allDonations.size();
		double totalDonationsAmount = allDonations.stream()
				.mapToDouble(d -> d.getAmount() != null ? d.getAmount().doubleValue() : 0.0)
				.sum();

		// Users who have joined an organisation (participation)
		long totalParticipants = userRepository.findAll().stream()
				.filter(u -> u.getJoinedOrganizationId() != null)
				.count();

		model.addAttribute("totalUsers",           totalUsers);
		model.addAttribute("totalOrgs",            totalOrgs);
		model.addAttribute("approvedOrgs",         approvedOrgs);
		model.addAttribute("pendingOrgsCount",     pendingOrgsCount);
		model.addAttribute("totalActions",         totalActions);
		model.addAttribute("totalDonationsCount",  totalDonationsCount);
		model.addAttribute("totalDonationsAmount", String.format("%.2f", totalDonationsAmount));
		model.addAttribute("totalParticipants",    totalParticipants);

		return "admin";
	}

	// -----------------------------------------------------------------------
	// Approve organisation (POST /admin/{orgId}/approve)
	// -----------------------------------------------------------------------
	@PostMapping("/{orgId}/approve")
	@ResponseBody
	public Map<String, String> approveOrganization(
			@PathVariable Long orgId,
			HttpSession session) {

		if (!Boolean.TRUE.equals(session.getAttribute("adminLoggedIn"))) {
			return Map.of("status", "error", "message", "Non autorisé");
		}

		Organization org = organizationRepository.findById(orgId).orElse(null);
		if (org != null) {
			org.setStatus(OrganizationStatus.APPROVED);
			organizationRepository.save(org);
			return Map.of("status", "success", "message", "Organisation approuvée");
		}
		return Map.of("status", "error", "message", "Organisation introuvable");
	}

	// -----------------------------------------------------------------------
	// Password helper (SHA-256 → Base64, same as AuthController)
	// -----------------------------------------------------------------------
	private String hashPassword(String password) {
		if (password == null) return "";
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hashBytes = digest.digest(password.getBytes(StandardCharsets.UTF_8));
			return Base64.getEncoder().encodeToString(hashBytes);
		} catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 indisponible", ex);
		}
	}
}