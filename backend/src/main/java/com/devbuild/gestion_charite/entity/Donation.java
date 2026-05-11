package com.devbuild.gestion_charite.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.devbuild.gestion_charite.entity.enums.DonationStatus;
import com.devbuild.gestion_charite.entity.enums.PaymentMethod;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Document(collection = "donations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Donation {

	@Id
	private Long id;

	private String donorName;

	private String donorEmail;

	private BigDecimal amount;

	private String message;

	private DonationStatus status;

	private Long actionId;

	private Long donorUserId;

	private PaymentMethod paymentMethod;

	@Indexed(unique = true)
	private String transactionId;

	private LocalDateTime createdAt;
}
