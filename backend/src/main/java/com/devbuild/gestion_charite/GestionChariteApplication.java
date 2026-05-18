package com.devbuild.gestion_charite;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.devbuild.gestion_charite.entity.Category;
import com.devbuild.gestion_charite.entity.CharityAction;
import com.devbuild.gestion_charite.entity.Organization;
import com.devbuild.gestion_charite.entity.enums.ActionStatus;
import com.devbuild.gestion_charite.entity.enums.OrganizationStatus;
import com.devbuild.gestion_charite.repository.CategoryRepository;
import com.devbuild.gestion_charite.repository.CharityActionRepository;
import com.devbuild.gestion_charite.repository.OrganizationRepository;
import com.devbuild.gestion_charite.service.MongoSequenceService;

@SpringBootApplication
public class GestionChariteApplication {

	public static void main(String[] args) {
		SpringApplication.run(GestionChariteApplication.class, args);
	}

	@Bean
	CommandLineRunner init(
			CategoryRepository categoryRepository,
			OrganizationRepository organizationRepository,
			CharityActionRepository charityActionRepository,
			MongoSequenceService mongoSequenceService
	) {
		return args -> {

			seedCategory(categoryRepository, mongoSequenceService, 1L, "Education");
			seedCategory(categoryRepository, mongoSequenceService, 2L, "Health");
			seedCategory(categoryRepository, mongoSequenceService, 3L, "Food");
			seedCategory(categoryRepository, mongoSequenceService, 4L, "Environment");
			seedCategory(categoryRepository, mongoSequenceService, 5L, "Emergency Relief");

			seedOrganization(organizationRepository, mongoSequenceService, 1L,
					"Hope Association",
					"123 Rue de la Paix, Casablanca 20000, Morocco",
					"MA001234567890",
					"Ahmed Hassan",
					"contact@hope.org",
					"Hope@12345",
					"+212 522 12 34 56",
					"https://via.placeholder.com/200/0066cc/ffffff?text=Hope",
					"A leading nonprofit dedicated to transforming lives through education and healthcare initiatives in underserved communities.",
					"Empowering communities through education, healthcare, and sustainable development");

			seedOrganization(organizationRepository, mongoSequenceService, 2L,
					"Health for All Foundation",
					"456 Avenue Mohammed V, Fez 30000, Morocco",
					"MA002345678901",
					"Fatima Nouri",
					"contact@healthforall.org",
					"Health@12345",
					"+212 535 62 34 56",
					"https://via.placeholder.com/200/00cc66/ffffff?text=Health",
					"Providing accessible healthcare services and medical training to rural and urban communities.",
					"Ensuring universal access to quality healthcare for all");

			seedOrganization(organizationRepository, mongoSequenceService, 3L,
					"Green Earth Initiative",
					"789 Boulevard Zerktouni, Marrakech 40000, Morocco",
					"MA003456789012",
					"Hassan Al-Mansouri",
					"contact@greenearth.org",
					"Green@12345",
					"+212 524 42 56 78",
					"https://via.placeholder.com/200/00aa00/ffffff?text=Green",
					"Environmental protection and sustainable development through community engagement and conservation projects.",
					"Protecting our planet for future generations through sustainable practices");

			seedOrganization(organizationRepository, mongoSequenceService, 4L,
					"Food Security Alliance",
					"321 Rue Colbert, Rabat 10000, Morocco",
					"MA004567890123",
					"Leila Benali",
					"contact@foodsecurity.org",
					"Food@12345",
					"+212 537 72 45 89",
					"https://via.placeholder.com/200/ff6600/ffffff?text=Food",
					"Fighting hunger and malnutrition through food distribution and nutrition education programs.",
					"Ending food insecurity and ensuring nutritional well-being");

			mongoSequenceService.resetSequence("categories", 5L);
			mongoSequenceService.resetSequence("organizations", 4L);

// Charity Actions - Always recreate to ensure all organizations have actions
		charityActionRepository.deleteAll();
		mongoSequenceService.resetSequence("charity_actions", 0L);
		
		var orgs = organizationRepository.findAll();

		// Education Actions
		for (Organization org : orgs) {
			if (org.getName().equals("Hope Association")) {
				createCharityAction(charityActionRepository, mongoSequenceService, org, 
					"Back To School Supplies", "Provide comprehensive school kits with notebooks, pens, and learning materials to 500 students in need",
					"Education", 5000, LocalDate.now(), LocalDate.now().plusMonths(3), "Casablanca",
					"https://via.placeholder.com/400/0066cc/ffffff?text=School+Supplies");

				createCharityAction(charityActionRepository, mongoSequenceService, org,
					"Vocational Training Program", "Offer free vocational training in IT and trade skills to 200 unemployed youth",
					"Education", 15000, LocalDate.now(), LocalDate.now().plusMonths(6), "Casablanca",
					"https://via.placeholder.com/400/0066cc/ffffff?text=Vocational+Training");
			}

			if (org.getName().equals("Health for All Foundation")) {
				createCharityAction(charityActionRepository, mongoSequenceService, org,
					"Mobile Medical Clinic", "Deploy medical teams to remote villages for free health check-ups and vaccinations",
					"Health", 12000, LocalDate.now(), LocalDate.now().plusMonths(4), "Fez",
					"https://via.placeholder.com/400/00cc66/ffffff?text=Medical+Clinic");

				createCharityAction(charityActionRepository, mongoSequenceService, org,
					"Maternal Health Initiative", "Support pregnant women and mothers with prenatal care and nutrition supplements",
					"Health", 8000, LocalDate.now().plusDays(5), LocalDate.now().plusMonths(5), "Tangier",
					"https://via.placeholder.com/400/00cc66/ffffff?text=Maternal+Health");
			}

			if (org.getName().equals("Green Earth Initiative")) {
				createCharityAction(charityActionRepository, mongoSequenceService, org,
					"Ocean Cleanup Drive", "Remove plastic waste from coastal areas and educate communities about environmental conservation",
					"Environment", 6000, LocalDate.now(), LocalDate.now().plusMonths(2), "Essaouira",
					"https://via.placeholder.com/400/00aa00/ffffff?text=Ocean+Cleanup");

				createCharityAction(charityActionRepository, mongoSequenceService, org,
					"Tree Planting Campaign", "Plant 10,000 native trees to combat desertification and restore ecosystems",
					"Environment", 9000, LocalDate.now().plusDays(10), LocalDate.now().plusMonths(6), "Marrakech",
					"https://via.placeholder.com/400/00aa00/ffffff?text=Tree+Planting");
			}

			if (org.getName().equals("Food Security Alliance")) {
				createCharityAction(charityActionRepository, mongoSequenceService, org,
					"Community Food Bank", "Distribute nutritious food packages to 300 families struggling with food insecurity",
					"Food", 7500, LocalDate.now(), LocalDate.now().plusMonths(3), "Rabat",
					"https://via.placeholder.com/400/ff6600/ffffff?text=Food+Bank");

				createCharityAction(charityActionRepository, mongoSequenceService, org,
					"School Nutrition Program", "Provide daily nutritious meals to 1000 schoolchildren in underfunded schools",
					"Food", 11000, LocalDate.now().plusDays(3), LocalDate.now().plusMonths(12), "Salé",
					"https://via.placeholder.com/400/ff6600/ffffff?text=School+Meals");
				}
			}

			System.out.println("Gestion Charite backend started with MongoDB.");
		};
	}

	private void seedCategory(CategoryRepository repo, MongoSequenceService seq, Long id, String name) {
		Category category = new Category();
		category.setId(id);
		category.setName(name);
		repo.save(category);
	}

	private void seedOrganization(
			OrganizationRepository repo,
			MongoSequenceService seq,
			Long id,
			String name,
			String legalAddress,
			String taxIdentificationNumber,
			String primaryContactName,
			String primaryContactEmail,
			String password,
			String primaryContactPhone,
			String logoUrl,
			String description,
			String mission
	) {
		Organization organization = new Organization();
		organization.setId(id);
		organization.setName(name);
		organization.setLegalAddress(legalAddress);
		organization.setTaxIdentificationNumber(taxIdentificationNumber);
		organization.setPrimaryContactName(primaryContactName);
		organization.setPrimaryContactEmail(primaryContactEmail);
		organization.setPassword(password);
		organization.setPrimaryContactPhone(primaryContactPhone);
		organization.setLogoUrl(logoUrl);
		organization.setDescription(description);
		organization.setMission(mission);
		organization.setStatus(OrganizationStatus.ACTIVE);
		repo.save(organization);
	}

	private void createCharityAction(CharityActionRepository repo, MongoSequenceService seq, 
			Organization org, String title, String description, String category,
			int targetAmount, LocalDate startDate, LocalDate endDate, String location, String imageUrl) {
		CharityAction action = new CharityAction();
		action.setId(seq.nextId("charity_actions"));
		action.setTitle(title);
		action.setDescription(description);
		action.setTargetAmount(new BigDecimal(targetAmount));
		action.setCollectedAmount(BigDecimal.ZERO);
		action.setStatus(ActionStatus.OPEN);
		action.setStartDate(startDate);
		action.setEndDate(endDate);
		action.setLocation(location);
		action.setOrganizationId(org.getId());
		action.setOrganizationName(org.getName());
		action.setCategoryName(category);
		action.setImage(imageUrl);
		repo.save(action);
	}
}