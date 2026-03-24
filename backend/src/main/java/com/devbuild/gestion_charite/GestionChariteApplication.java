package com.devbuild.gestion_charite;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.springframework.context.annotation.Bean;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

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
			if (categoryRepository.count() == 0) {
				categoryRepository.save(new Category(null, "Education"));
				categoryRepository.save(new Category(null, "Health"));
				categoryRepository.save(new Category(null, "Food"));
			}

			if (organizationRepository.count() == 0) {
				organizationRepository.save(new Organization(
					null,
					"Hope Association",
					"Supports vulnerable families",
					OrganizationStatus.ACTIVE
				));
			}

			if (charityActionRepository.count() == 0) {
				charityActionRepository.save(new CharityAction(
					null,
					"Back To School Packs",
					"Provide school kits to children in need",
					new BigDecimal("5000"),
					BigDecimal.ZERO,
					ActionStatus.OPEN,
					"Hope Association",
					"Education",
					LocalDate.now(),
					LocalDate.now().plusMonths(2)
				));
			}

			System.out.println("Gestion Charite backend started with H2 database.");
		};
	}
}
