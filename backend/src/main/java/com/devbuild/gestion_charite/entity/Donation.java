package com.devbuild.gestion_charite.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.devbuild.gestion_charite.entity.enums.DonationStatus;
import com.devbuild.gestion_charite.entity.enums.PaymentMethod;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "donations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Donation {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String donorName;

	private String donorEmail;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal amount;

	@Column(length = 1000)
	private String message;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private DonationStatus status;

	@Column(nullable = false)
	private Long actionId;

	@Column(nullable = false)
	private Long donorUserId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private PaymentMethod paymentMethod;

	@Column(nullable = false, unique = true)
	private String transactionId;

	@Column(nullable = false)
	private LocalDateTime createdAt;
}
