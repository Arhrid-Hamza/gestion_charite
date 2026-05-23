package com.devbuild.gestion_charite.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
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
import com.devbuild.gestion_charite.entity.Category;
import com.devbuild.gestion_charite.entity.Organization;
import com.devbuild.gestion_charite.entity.Participation;
import com.devbuild.gestion_charite.entity.User;
import com.devbuild.gestion_charite.entity.enums.OrganizationStatus;
import com.devbuild.gestion_charite.entity.enums.Role;
import com.devbuild.gestion_charite.entity.enums.ActionStatus;
import com.devbuild.gestion_charite.repository.CharityActionRepository;
import com.devbuild.gestion_charite.repository.CategoryRepository;
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
	private final CategoryRepository categoryRepository;
	private final DonationRepository     donationRepository;
	private final ParticipationRepository participationRepository;

	public AdminController(
			UserRepository userRepository,
			OrganizationRepository organizationRepository,
			CharityActionRepository charityActionRepository,
			CategoryRepository categoryRepository,
			DonationRepository donationRepository,
			ParticipationRepository participationRepository) {
		this.userRepository          = userRepository;
		this.organizationRepository  = organizationRepository;
		this.charityActionRepository = charityActionRepository;
		this.categoryRepository      = categoryRepository;
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
	// ORGANIZATION UPDATE (POST /admin/organizations/{orgId}/edit)
	// -----------------------------------------------------------------------
	@PostMapping("/organizations/{orgId}/edit")
	public String editOrganization(
			@PathVariable Long orgId,
			@RequestParam String name,
			@RequestParam(required = false) String legalAddress,
			@RequestParam(required = false) String taxIdentificationNumber,
			@RequestParam(required = false) String primaryContactName,
			@RequestParam(required = false) String primaryContactEmail,
			@RequestParam(required = false) String primaryContactPhone,
			@RequestParam(required = false) String description,
			@RequestParam(required = false) String mission,
			@RequestParam(required = false) String logoUrl,
			@RequestParam(required = false) String status,
			HttpSession session,
			RedirectAttributes redirectAttributes) {
		if (!isLoggedIn(session)) return "redirect:/admin/login";

		Organization org = organizationRepository.findById(orgId).orElse(null);
		if (org == null) {
			redirectAttributes.addFlashAttribute("errorMessage", "Organisation introuvable.");
			return "redirect:/admin/organizations";
		}

		org.setName(name);
		org.setLegalAddress(legalAddress);
		org.setTaxIdentificationNumber(taxIdentificationNumber);
		org.setPrimaryContactName(primaryContactName);
		org.setPrimaryContactEmail(primaryContactEmail);
		org.setPrimaryContactPhone(primaryContactPhone);
		org.setDescription(description);
		org.setMission(mission);
		org.setLogoUrl(logoUrl);
		if (status != null && !status.isBlank()) {
			try {
				org.setStatus(OrganizationStatus.valueOf(status));
			} catch (IllegalArgumentException ignored) {
				// Keep existing status if the submitted value is invalid.
			}
		}

		organizationRepository.save(org);
		redirectAttributes.addFlashAttribute("successMessage", "Organisation mise à jour avec succès.");
		return "redirect:/admin/organizations/" + orgId;
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

		try {
			List<CharityAction> actions = charityActionRepository.findAll();
			Map<Long, Integer> progressByAction = actions.stream().collect(Collectors.toMap(
					CharityAction::getId,
					action -> {
						if (action.getTargetAmount() == null || action.getTargetAmount().doubleValue() <= 0) {
							return 0;
						}
						double collected = action.getCollectedAmount() != null ? action.getCollectedAmount().doubleValue() : 0.0;
						double target = action.getTargetAmount().doubleValue();
						return (int) Math.min(100, Math.max(0, Math.round((collected / target) * 100)));
					}
				));
			Map<Long, Long> donationCountByAction = donationRepository.findAll().stream()
					.filter(donation -> donation.getActionId() != null)
					.collect(Collectors.groupingBy(
						Donation::getActionId,
						Collectors.counting()
					));
			List<String> categories = categoryRepository.findAll().stream()
					.map(Category::getName)
					.filter(name -> name != null && !name.isBlank())
					.sorted(String.CASE_INSENSITIVE_ORDER)
					.toList();
			model.addAttribute("actions", actions);
			model.addAttribute("progressByAction", progressByAction);
			model.addAttribute("donationCountByAction", donationCountByAction);
			model.addAttribute("categories", categories);
		} catch (Exception e) {
			model.addAttribute("actions", java.util.Collections.emptyList());
			model.addAttribute("progressByAction", java.util.Collections.emptyMap());
			model.addAttribute("donationCountByAction", java.util.Collections.emptyMap());
			model.addAttribute("categories", java.util.Collections.emptyList());
		}

		return "admin-actions";
	}

	// -----------------------------------------------------------------------
	// ACTION DETAIL (GET /admin/actions/{actionId})
	// -----------------------------------------------------------------------
	@GetMapping("/actions/{actionId}")
	public String actionDetail(
			@PathVariable Long actionId,
			HttpSession session,
			Model model,
			RedirectAttributes redirectAttributes) {
		if (!isLoggedIn(session)) return "redirect:/admin/login";

		CharityAction action = charityActionRepository.findById(actionId).orElse(null);
		if (action == null) {
			redirectAttributes.addFlashAttribute("errorMessage", "Action introuvable.");
			return "redirect:/admin/actions";
		}

		List<Donation> donations = donationRepository.findByActionId(actionId);
		double totalDonated = donations.stream()
				.mapToDouble(d -> d.getAmount() != null ? d.getAmount().doubleValue() : 0.0)
				.sum();

		model.addAttribute("action", action);
		model.addAttribute("organizations", organizationRepository.findAll());
		model.addAttribute("categories", categoryRepository.findAll().stream()
				.map(Category::getName)
				.filter(name -> name != null && !name.isBlank())
				.sorted(String.CASE_INSENSITIVE_ORDER)
				.toList());
		model.addAttribute("statuses", ActionStatus.values());
		model.addAttribute("donationsCount", donations.size());
		model.addAttribute("totalDonated", String.format("%.2f", totalDonated));

		return "admin-action-detail";
	}

	// -----------------------------------------------------------------------
	// ACTION UPDATE (POST /admin/actions/{actionId}/edit)
	// -----------------------------------------------------------------------
	@PostMapping("/actions/{actionId}/edit")
	public String editAction(
			@PathVariable Long actionId,
			@RequestParam String title,
			@RequestParam(required = false) String description,
			@RequestParam(required = false) String categoryName,
			@RequestParam(required = false) String targetAmount,
			@RequestParam(required = false) String collectedAmount,
			@RequestParam(required = false) String status,
			@RequestParam(required = false) String organizationId,
			@RequestParam(required = false) String startDate,
			@RequestParam(required = false) String endDate,
			@RequestParam(required = false) String location,
			@RequestParam(required = false) String image,
			@RequestParam(required = false) String mediaUrls,
			HttpSession session,
			RedirectAttributes redirectAttributes) {
		if (!isLoggedIn(session)) return "redirect:/admin/login";

		CharityAction action = charityActionRepository.findById(actionId).orElse(null);
		if (action == null) {
			redirectAttributes.addFlashAttribute("errorMessage", "Action introuvable.");
			return "redirect:/admin/actions";
		}

		action.setTitle(title);
		action.setDescription(description);
		action.setCategoryName(categoryName);
		action.setTargetAmount(parseBigDecimal(targetAmount));
		action.setCollectedAmount(parseBigDecimal(collectedAmount));
		if (status != null && !status.isBlank()) {
			try {
				action.setStatus(ActionStatus.valueOf(status));
			} catch (IllegalArgumentException ignored) {
				// Keep existing status if the submitted value is invalid.
			}
		}
		if (organizationId != null && !organizationId.isBlank()) {
			Long orgId = parseLong(organizationId);
			action.setOrganizationId(orgId);
			organizationRepository.findById(orgId).ifPresent(org -> action.setOrganizationName(org.getName()));
		}
		action.setStartDate(parseLocalDate(startDate));
		action.setEndDate(parseLocalDate(endDate));
		action.setLocation(location);
		action.setImage(image);
		action.setMediaUrls(mediaUrls);

		charityActionRepository.save(action);
		redirectAttributes.addFlashAttribute("successMessage", "Action mise à jour avec succès.");
		return "redirect:/admin/actions/" + actionId;
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
		Map<Long, String> actionTitlesById = charityActionRepository.findAll().stream()
				.filter(action -> action.getId() != null)
				.collect(Collectors.toMap(
						CharityAction::getId,
						action -> action.getTitle() != null && !action.getTitle().isBlank()
								? action.getTitle()
								: "Action #" + action.getId(),
						(existing, replacement) -> existing
				));
		participations.forEach(participation -> {
			if ((participation.getParticipantName() == null || participation.getParticipantName().isBlank())
					&& participation.getParticipantUserId() != null) {
				userRepository.findById(participation.getParticipantUserId())
						.ifPresent(user -> participation.setParticipantName(resolveDisplayName(user)));
				}
		});

		long uniqueActions = participations.stream()
				.map(Participation::getActionId)
				.filter(id -> id != null)
				.distinct()
				.count();

		model.addAttribute("participations", participations);
		model.addAttribute("actionTitlesById", actionTitlesById);
		model.addAttribute("totalCount",     participations.size());
		model.addAttribute("uniqueActions",  uniqueActions);

		return "admin-participations";
	}

	private String resolveDisplayName(com.devbuild.gestion_charite.entity.User user) {
		if (user.getFullName() != null && !user.getFullName().isBlank()) {
			return user.getFullName();
		}
		return user.getEmail() != null && !user.getEmail().isBlank() ? user.getEmail() : "—";
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
	private BigDecimal parseBigDecimal(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		try {
			return new BigDecimal(value.trim());
		} catch (NumberFormatException ex) {
			return null;
		}
	}

	private Long parseLong(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		try {
			return Long.valueOf(value.trim());
		} catch (NumberFormatException ex) {
			return null;
		}
	}

	private LocalDate parseLocalDate(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		try {
			return LocalDate.parse(value.trim());
		} catch (Exception ex) {
			return null;
		}
	}

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