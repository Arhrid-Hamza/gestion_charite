package com.devbuild.gestion_charite.controller;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.devbuild.gestion_charite.entity.CharityAction;
import com.devbuild.gestion_charite.entity.Donation;
import com.devbuild.gestion_charite.entity.Organization;
import com.devbuild.gestion_charite.entity.Participation;
import com.devbuild.gestion_charite.entity.User;
import com.devbuild.gestion_charite.entity.enums.OrganizationStatus;
import com.devbuild.gestion_charite.entity.enums.Role;
import com.devbuild.gestion_charite.repository.CharityActionRepository;
import com.devbuild.gestion_charite.repository.DonationRepository;
import com.devbuild.gestion_charite.repository.OrganizationRepository;
import com.devbuild.gestion_charite.repository.ParticipationRepository;
import com.devbuild.gestion_charite.repository.UserRepository;

import jakarta.servlet.http.HttpSession;

@Controller
@RequestMapping("/admin")
public class AdminController {

	// -----------------------------------------------------------------------
	// Hardcoded admin credentials
	// -----------------------------------------------------------------------
	private static final String ADMIN_EMAIL    = "admin@gestion-charite.local";
	private static final String ADMIN_PASSWORD = "ADMIN123456";

	private final UserRepository         userRepository;
	private final OrganizationRepository organizationRepository;
	private final CharityActionRepository charityActionRepository;
	private final DonationRepository     donationRepository;
	private final ParticipationRepository participationRepository;

	public AdminController(
			UserRepository userRepository,
			OrganizationRepository organizationRepository,
			CharityActionRepository charityActionRepository,
			DonationRepository donationRepository,
			ParticipationRepository participationRepository) {
		this.userRepository          = userRepository;
		this.organizationRepository  = organizationRepository;
		this.charityActionRepository = charityActionRepository;
		this.donationRepository      = donationRepository;
		this.participationRepository = participationRepository;
	}

	// -----------------------------------------------------------------------
	// Auth guard helper
	// -----------------------------------------------------------------------
	private boolean isLoggedIn(HttpSession session) {
		return Boolean.TRUE.equals(session.getAttribute("adminLoggedIn"));
	}

	// -----------------------------------------------------------------------
	// Login page (GET)
	// -----------------------------------------------------------------------
	@GetMapping("/login")
	public String loginPage(HttpSession session, Model model) {
		if (isLoggedIn(session)) return "redirect:/admin";
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

		if (ADMIN_EMAIL.equalsIgnoreCase(email) && ADMIN_PASSWORD.equals(password)) {
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
		if (!isLoggedIn(session)) return "redirect:/admin/login";

		List<Organization> pendingOrgs = organizationRepository.findByStatus(OrganizationStatus.PENDING);
		model.addAttribute("organizations", pendingOrgs);

		long totalUsers       = userRepository.count();
		long totalOrgs        = organizationRepository.count();
		long approvedOrgs     = organizationRepository.findByStatus(OrganizationStatus.APPROVED).size();
		long pendingOrgsCount = pendingOrgs.size();
		long totalActions     = charityActionRepository.count();

		List<Donation> allDonations     = donationRepository.findAll();
		long   totalDonationsCount      = allDonations.size();
		double totalDonationsAmount     = allDonations.stream()
				.mapToDouble(d -> d.getAmount() != null ? d.getAmount().doubleValue() : 0.0).sum();

		long totalParticipants = userRepository.findAll().stream()
				.filter(u -> {
					try {
						java.lang.reflect.Method m = u.getClass().getMethod("getJoinedOrganizationId");
						return m.invoke(u) != null;
					} catch (Exception e) { return false; }
				}).count();

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
	public Map<String, String> approveOrganization(@PathVariable Long orgId, HttpSession session) {
		if (!isLoggedIn(session)) return Map.of("status", "error", "message", "Non autorisé");

		Organization org = organizationRepository.findById(orgId).orElse(null);
		if (org != null) {
			org.setStatus(OrganizationStatus.APPROVED);
			organizationRepository.save(org);
			return Map.of("status", "success", "message", "Organisation approuvée");
		}
		return Map.of("status", "error", "message", "Organisation introuvable");
	}

	// -----------------------------------------------------------------------
	// ORGANIZATIONS LIST (GET /admin/organizations)
	// -----------------------------------------------------------------------
	@GetMapping("/organizations")
	public String organizationsList(
			@RequestParam(required = false) String status,
			HttpSession session,
			Model model) {
		if (!isLoggedIn(session)) return "redirect:/admin/login";

		List<Organization> organizations;
		if (status != null && !status.isBlank()) {
			try {
				OrganizationStatus os = OrganizationStatus.valueOf(status);
				organizations = organizationRepository.findByStatus(os);
			} catch (IllegalArgumentException e) {
				organizations = organizationRepository.findAll();
			}
		} else {
			organizations = organizationRepository.findAll();
		}

		model.addAttribute("organizations", organizations);
		model.addAttribute("statusFilter", status);
		return "admin-organizations";
	}

	// -----------------------------------------------------------------------
	// ORGANIZATION DETAIL (GET /admin/organizations/{orgId})
	// -----------------------------------------------------------------------
	@GetMapping("/organizations/{orgId}")
	public String organizationDetail(
			@PathVariable Long orgId,
			HttpSession session,
			Model model,
			RedirectAttributes redirectAttributes) {
		if (!isLoggedIn(session)) return "redirect:/admin/login";

		Organization org = organizationRepository.findById(orgId).orElse(null);
		if (org == null) {
			redirectAttributes.addFlashAttribute("errorMessage", "Organisation introuvable.");
			return "redirect:/admin/organizations";
		}

		List<CharityAction> actions = charityActionRepository.findByOrganizationId(orgId);
		int actionsCount = actions.size();

		// Total donations for all actions of this org
		List<Donation> allDonations = actions.stream()
				.flatMap(a -> donationRepository.findByActionId(a.getId()).stream())
				.collect(Collectors.toList());
		int donationsCount = allDonations.size();
		double totalCollected = allDonations.stream()
				.mapToDouble(d -> d.getAmount() != null ? d.getAmount().doubleValue() : 0.0).sum();

		model.addAttribute("org",            org);
		model.addAttribute("actions",        actions);
		model.addAttribute("actionsCount",   actionsCount);
		model.addAttribute("donationsCount", donationsCount);
		model.addAttribute("totalCollected", String.format("%.2f", totalCollected));

		return "admin-organization-detail";
	}

	// -----------------------------------------------------------------------
	// REJECT ORGANIZATION (POST /admin/organizations/{orgId}/reject)
	// -----------------------------------------------------------------------
	@PostMapping("/organizations/{orgId}/reject")
	public String rejectOrganization(
			@PathVariable Long orgId,
			HttpSession session,
			RedirectAttributes redirectAttributes) {
		if (!isLoggedIn(session)) return "redirect:/admin/login";

		Organization org = organizationRepository.findById(orgId).orElse(null);
		if (org != null) {
			org.setStatus(OrganizationStatus.REJECTED);
			organizationRepository.save(org);
			redirectAttributes.addFlashAttribute("successMessage",
					"Organisation « " + org.getName() + " » rejetée.");
		} else {
			redirectAttributes.addFlashAttribute("errorMessage", "Organisation introuvable.");
		}
		return "redirect:/admin/organizations/" + orgId;
	}

	// -----------------------------------------------------------------------
	// ACTIONS LIST (GET /admin/actions)
	// -----------------------------------------------------------------------
	@GetMapping("/actions")
	public String actionsList(HttpSession session, Model model) {
		if (!isLoggedIn(session)) return "redirect:/admin/login";

		List<CharityAction> actions = charityActionRepository.findAll();

		// Count donations per action safely
		Map<Long, Long> donationCountByAction = actions.stream()
				.filter(a -> a.getId() != null)
				.collect(Collectors.toMap(
						CharityAction::getId,
						a -> {
							try {
								List<Donation> dons = donationRepository.findByActionId(a.getId());
								return dons != null ? (long) dons.size() : 0L;
							} catch (Exception e) {
								return 0L;
							}
						},
						(a, b) -> a
				));

		// Distinct categories for filter dropdown
		List<String> categories = actions.stream()
				.map(CharityAction::getCategoryName)
				.filter(c -> c != null && !c.isBlank())
				.distinct()
				.sorted()
				.collect(Collectors.toList());

		model.addAttribute("actions",               actions);
		model.addAttribute("donationCountByAction", donationCountByAction);
		model.addAttribute("categories",            categories);

		return "admin-actions";
	}

	// -----------------------------------------------------------------------
	// DONATIONS LIST (GET /admin/donations)
	// -----------------------------------------------------------------------
	@GetMapping("/donations")
	public String donationsList(HttpSession session, Model model) {
		if (!isLoggedIn(session)) return "redirect:/admin/login";

		List<Donation> donations = donationRepository.findAll();

		long   totalCount  = donations.size();
		double totalAmount = donations.stream()
				.mapToDouble(d -> d.getAmount() != null ? d.getAmount().doubleValue() : 0.0).sum();
		double avgAmount   = totalCount > 0 ? totalAmount / totalCount : 0.0;

		model.addAttribute("donations",    donations);
		model.addAttribute("totalCount",   totalCount);
		model.addAttribute("totalAmount",  String.format("%.2f", totalAmount));
		model.addAttribute("avgAmount",    String.format("%.2f", avgAmount));

		return "admin-donations";
	}

	// -----------------------------------------------------------------------
	// PARTICIPATIONS LIST (GET /admin/participations)
	// -----------------------------------------------------------------------
	@GetMapping("/participations")
	public String participationsList(HttpSession session, Model model) {
		if (!isLoggedIn(session)) return "redirect:/admin/login";

		List<Participation> participations = participationRepository.findAll();

		long uniqueActions = participations.stream()
				.map(Participation::getActionId)
				.filter(id -> id != null)
				.distinct()
				.count();

		model.addAttribute("participations", participations);
		model.addAttribute("totalCount",     participations.size());
		model.addAttribute("uniqueActions",  uniqueActions);

		return "admin-participations";
	}

	// -----------------------------------------------------------------------
	// USERS LIST (GET /admin/users)
	// -----------------------------------------------------------------------
	@GetMapping("/users")
	public String usersList(HttpSession session, Model model) {
		if (!isLoggedIn(session)) return "redirect:/admin/login";
		model.addAttribute("users", userRepository.findAll());
		return "admin-users";
	}

	// -----------------------------------------------------------------------
	// USER DETAIL (GET /admin/users/{userId})
	// -----------------------------------------------------------------------
	@GetMapping("/users/{userId}")
	public String userDetail(
			@PathVariable Long userId,
			HttpSession session,
			Model model,
			RedirectAttributes redirectAttributes) {
		if (!isLoggedIn(session)) return "redirect:/admin/login";

		User user = userRepository.findById(userId).orElse(null);
		if (user == null) {
			redirectAttributes.addFlashAttribute("errorMessage", "Utilisateur introuvable.");
			return "redirect:/admin/users";
		}

		List<Donation> userDonations = donationRepository.findByDonorUserIdOrderByCreatedAtDesc(userId);
		double totalDonated = userDonations.stream()
				.mapToDouble(d -> d.getAmount() != null ? d.getAmount().doubleValue() : 0.0).sum();

		model.addAttribute("user",           user);
		model.addAttribute("donationsCount", userDonations.size());
		model.addAttribute("totalDonated",   String.format("%.2f", totalDonated));
		model.addAttribute("roles",          Role.values());

		return "admin-user-detail";
	}

	// -----------------------------------------------------------------------
	// USER EDIT (POST /admin/users/{userId}/edit)
	// -----------------------------------------------------------------------
	@PostMapping("/users/{userId}/edit")
	public String editUser(
			@PathVariable Long userId,
			@RequestParam String fullName,
			@RequestParam String email,
			@RequestParam(required = false) String phone,
			@RequestParam(required = false) String preferredLanguage,
			@RequestParam Role role,
			@RequestParam(required = false) String address,
			HttpSession session,
			RedirectAttributes redirectAttributes) {
		if (!isLoggedIn(session)) return "redirect:/admin/login";

		User user = userRepository.findById(userId).orElse(null);
		if (user == null) {
			redirectAttributes.addFlashAttribute("errorMessage", "Utilisateur introuvable.");
			return "redirect:/admin/users";
		}

		user.setFullName(fullName);
		user.setEmail(email);
		if (preferredLanguage != null) user.setPreferredLanguage(preferredLanguage);
		user.setRole(role);
		try { if (phone   != null) user.setPhone(phone);     } catch (Exception ignored) {}
		try { if (address != null) user.setAddress(address); } catch (Exception ignored) {}

		userRepository.save(user);
		redirectAttributes.addFlashAttribute("successMessage",
				"Utilisateur « " + fullName + " » mis à jour avec succès.");
		return "redirect:/admin/users/" + userId;
	}

	// -----------------------------------------------------------------------
	// USER DELETE (POST /admin/users/{userId}/delete)
	// -----------------------------------------------------------------------
	@PostMapping("/users/{userId}/delete")
	public String deleteUser(
			@PathVariable Long userId,
			HttpSession session,
			RedirectAttributes redirectAttributes) {
		if (!isLoggedIn(session)) return "redirect:/admin/login";

		User user = userRepository.findById(userId).orElse(null);
		if (user != null) {
			userRepository.delete(user);
			redirectAttributes.addFlashAttribute("successMessage", "Utilisateur supprimé avec succès.");
		} else {
			redirectAttributes.addFlashAttribute("errorMessage", "Utilisateur introuvable.");
		}
		return "redirect:/admin/users";
	}

	// -----------------------------------------------------------------------
	// Password helper
	// -----------------------------------------------------------------------
	private String hashPassword(String password) {
		if (password == null) return "";
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hashBytes = digest.digest(password.getBytes(StandardCharsets.UTF_8));
			return java.util.Base64.getEncoder().encodeToString(hashBytes);
		} catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 indisponible", ex);
		}
	}
}