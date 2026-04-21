package com.devbuild.gestion_charite.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.devbuild.gestion_charite.entity.CharityAction;
import com.devbuild.gestion_charite.entity.Donation;
import com.devbuild.gestion_charite.entity.User;
import com.devbuild.gestion_charite.entity.enums.DonationStatus;
import com.devbuild.gestion_charite.entity.enums.PaymentMethod;
import com.devbuild.gestion_charite.repository.CharityActionRepository;
import com.devbuild.gestion_charite.repository.DonationRepository;
import com.devbuild.gestion_charite.repository.UserRepository;

@Service
public class DonationProcessingService {

	private final DonationRepository donationRepository;
	private final CharityActionRepository charityActionRepository;
	private final UserRepository userRepository;

	public DonationProcessingService(
			DonationRepository donationRepository,
			CharityActionRepository charityActionRepository,
			UserRepository userRepository
	) {
		this.donationRepository = donationRepository;
		this.charityActionRepository = charityActionRepository;
		this.userRepository = userRepository;
	}

	@Transactional
	public Donation createConfirmedDonation(
			Long actionId,
			Long donorUserId,
			BigDecimal amount,
			String message,
			PaymentMethod paymentMethod,
			String transactionId
	) {
		if (actionId == null || donorUserId == null || amount == null) {
			throw new IllegalArgumentException("actionId, donorUserId and amount are required");
		}
		if (amount.compareTo(BigDecimal.ZERO) <= 0) {
			throw new IllegalArgumentException("amount must be greater than zero");
		}

		String normalizedTransactionId = normalizeTransactionId(paymentMethod, transactionId);
		if (donationRepository.existsByTransactionId(normalizedTransactionId)) {
			return donationRepository.findByTransactionId(normalizedTransactionId)
					.orElseThrow(() -> new IllegalStateException("Donation lookup failed"));
		}

		CharityAction action = charityActionRepository.findById(actionId)
				.orElseThrow(() -> new IllegalArgumentException("Unknown charity action"));
		User donor = userRepository.findById(donorUserId)
				.orElseThrow(() -> new IllegalArgumentException("Unknown donor user"));

		Donation donation = new Donation();
		donation.setActionId(actionId);
		donation.setDonorUserId(donorUserId);
		donation.setAmount(amount);
		donation.setMessage(message);
		donation.setDonorName(donor.getFullName());
		donation.setDonorEmail(donor.getEmail());
		donation.setPaymentMethod(paymentMethod == null ? PaymentMethod.PAYPAL : paymentMethod);
		donation.setTransactionId(normalizedTransactionId);
		donation.setStatus(DonationStatus.CONFIRMED);
		donation.setCreatedAt(LocalDateTime.now());

		Donation savedDonation = donationRepository.save(donation);

		BigDecimal current = action.getCollectedAmount() == null ? BigDecimal.ZERO : action.getCollectedAmount();
		action.setCollectedAmount(current.add(savedDonation.getAmount()));
		charityActionRepository.save(action);

		return savedDonation;
	}

	private String normalizeTransactionId(PaymentMethod paymentMethod, String transactionId) {
		if (transactionId != null && !transactionId.isBlank()) {
			return transactionId;
		}
		String method = paymentMethod == null ? "PAY" : paymentMethod.name();
		String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
		return method + "-" + suffix;
	}
}
