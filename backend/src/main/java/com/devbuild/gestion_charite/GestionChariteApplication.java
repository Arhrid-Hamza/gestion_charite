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

@SpringBootApplication
public class GestionChariteApplication {

	public static void main(String[] args) {
		SpringApplication.run(GestionChariteApplication.class, args);
	}

	@Bean
	CommandLineRunner init(
			CategoryRepository categoryRepository,
			OrganizationRepository organizationRepository,
			CharityActionRepository charityActionRepository
	) {
		return args -> {

			// Categories
			if (categoryRepository.count() == 0) {
				categoryRepository.save(new Category(null, "Education"));
				categoryRepository.save(new Category(null, "Health"));
				categoryRepository.save(new Category(null, "Food"));
			}

			// Organization
			Organization organization = null;
			if (organizationRepository.count() == 0) {
				organization = new Organization();
				organization.setName("Hope Association");
				organization.setLegalAddress("123 Rue de la Paix, Casablanca 20000, Morocco");
				organization.setTaxIdentificationNumber("MA001234567890");
				organization.setPrimaryContactName("Ahmed Hassan");
				organization.setPrimaryContactEmail("contact@hope.org");
				organization.setPassword("Hope@12345");
				organization.setPrimaryContactPhone("+212 5XX-XXXXXX");
				organization.setDescription("A nonprofit organization dedicated to helping underprivileged communities");
				organization.setMission("To provide education, healthcare, and community support services");
				organization.setStatus(OrganizationStatus.ACTIVE);

				organizationRepository.save(organization);
			} else {
				organization = organizationRepository.findAll().get(0);
			}

			// Charity Action
			if (charityActionRepository.count() == 0) {
				CharityAction action = new CharityAction();
				action.setTitle("Back To School Packs");
				action.setDescription("Provide school kits to children in need");
				action.setTargetAmount(new BigDecimal("5000"));
				action.setCollectedAmount(BigDecimal.ZERO);
				action.setStatus(ActionStatus.OPEN);
				action.setStartDate(LocalDate.now());
				action.setEndDate(LocalDate.now().plusMonths(2));
				action.setLocation("Casablanca");
				
				// Set required fields
				action.setOrganizationId(organization.getId());
				action.setOrganizationName(organization.getName());
				action.setCategoryName("Education");

				charityActionRepository.save(action);
			}

			System.out.println("Gestion Charite backend started with H2 database.");
		};
	}
}