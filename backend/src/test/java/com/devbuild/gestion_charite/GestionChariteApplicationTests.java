package com.devbuild.gestion_charite;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.devbuild.gestion_charite.repository.CategoryRepository;
import com.devbuild.gestion_charite.repository.CharityActionRepository;
import com.devbuild.gestion_charite.repository.DonationRepository;
import com.devbuild.gestion_charite.repository.OrganizationRepository;
import com.devbuild.gestion_charite.repository.ParticipationRepository;
import com.devbuild.gestion_charite.repository.UserRepository;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class GestionChariteApplicationTests {

	@Autowired
	private CategoryRepository categoryRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private OrganizationRepository organizationRepository;

	@Autowired
	private CharityActionRepository charityActionRepository;

	@Autowired
	private DonationRepository donationRepository;

	@Autowired
	private ParticipationRepository participationRepository;

	@Test
	void contextLoads() {
		// Verify MongoDB repositories are properly initialized and can be accessed
		assertTrue(categoryRepository != null);
		assertTrue(userRepository != null);
		assertTrue(organizationRepository != null);
		assertTrue(charityActionRepository != null);
		assertTrue(donationRepository != null);
		assertTrue(participationRepository != null);
	}
}
