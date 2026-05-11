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

			// Categories
			if (categoryRepository.count() == 0) {
				categoryRepository.save(new Category(mongoSequenceService.nextId("categories"), "Education"));
				categoryRepository.save(new Category(mongoSequenceService.nextId("categories"), "Health"));
				categoryRepository.save(new Category(mongoSequenceService.nextId("categories"), "Food"));
				categoryRepository.save(new Category(mongoSequenceService.nextId("categories"), "Environment"));
				categoryRepository.save(new Category(mongoSequenceService.nextId("categories"), "Emergency Relief"));
			}

			// Organizations
			if (organizationRepository.count() == 0) {
				// Hope Association
				Organization org1 = new Organization();
				org1.setId(mongoSequenceService.nextId("organizations"));
				org1.setName("Hope Association");
				org1.setLegalAddress("123 Rue de la Paix, Casablanca 20000, Morocco");
				org1.setTaxIdentificationNumber("MA001234567890");
				org1.setPrimaryContactName("Ahmed Hassan");
				org1.setPrimaryContactEmail("contact@hope.org");
				org1.setPassword("Hope@12345");
				org1.setPrimaryContactPhone("+212 522 12 34 56");
				org1.setDescription("A leading nonprofit dedicated to transforming lives through education and healthcare initiatives in underserved communities.");
				org1.setMission("Empowering communities through education, healthcare, and sustainable development");
				org1.setStatus(OrganizationStatus.ACTIVE);
				org1.setLogoUrl("https://via.placeholder.com/200/0066cc/ffffff?text=Hope");
				organizationRepository.save(org1);

				// Health for All Foundation
				Organization org2 = new Organization();
				org2.setId(mongoSequenceService.nextId("organizations"));
				org2.setName("Health for All Foundation");
				org2.setLegalAddress("456 Avenue Mohammed V, Fez 30000, Morocco");
				org2.setTaxIdentificationNumber("MA002345678901");
				org2.setPrimaryContactName("Fatima Nouri");
				org2.setPrimaryContactEmail("contact@healthforall.org");
				org2.setPassword("Health@12345");
				org2.setPrimaryContactPhone("+212 535 62 34 56");
				org2.setDescription("Providing accessible healthcare services and medical training to rural and urban communities.");
				org2.setMission("Ensuring universal access to quality healthcare for all");
				org2.setStatus(OrganizationStatus.ACTIVE);
				org2.setLogoUrl("https://via.placeholder.com/200/00cc66/ffffff?text=Health");
				organizationRepository.save(org2);

				// Green Earth Initiative
				Organization org3 = new Organization();
				org3.setId(mongoSequenceService.nextId("organizations"));
				org3.setName("Green Earth Initiative");
				org3.setLegalAddress("789 Boulevard Zerktouni, Marrakech 40000, Morocco");
				org3.setTaxIdentificationNumber("MA003456789012");
				org3.setPrimaryContactName("Hassan Al-Mansouri");
				org3.setPrimaryContactEmail("contact@greenearth.org");
				org3.setPassword("Green@12345");
				org3.setPrimaryContactPhone("+212 524 42 56 78");
				org3.setDescription("Environmental protection and sustainable development through community engagement and conservation projects.");
				org3.setMission("Protecting our planet for future generations through sustainable practices");
				org3.setStatus(OrganizationStatus.ACTIVE);
				org3.setLogoUrl("https://via.placeholder.com/200/00aa00/ffffff?text=Green");
				organizationRepository.save(org3);

				// Food Security Alliance
				Organization org4 = new Organization();
				org4.setId(mongoSequenceService.nextId("organizations"));
				org4.setName("Food Security Alliance");
				org4.setLegalAddress("321 Rue Colbert, Rabat 10000, Morocco");
				org4.setTaxIdentificationNumber("MA004567890123");
				org4.setPrimaryContactName("Leila Benali");
				org4.setPrimaryContactEmail("contact@foodsecurity.org");
				org4.setPassword("Food@12345");
				org4.setPrimaryContactPhone("+212 537 72 45 89");
				org4.setDescription("Fighting hunger and malnutrition through food distribution and nutrition education programs.");
				org4.setMission("Ending food insecurity and ensuring nutritional well-being");
				org4.setStatus(OrganizationStatus.ACTIVE);
				org4.setLogoUrl("https://via.placeholder.com/200/ff6600/ffffff?text=Food");
				organizationRepository.save(org4);
			}

			// Charity Actions
			if (charityActionRepository.count() == 0) {
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
			}

			System.out.println("Gestion Charite backend started with MongoDB.");
		};
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