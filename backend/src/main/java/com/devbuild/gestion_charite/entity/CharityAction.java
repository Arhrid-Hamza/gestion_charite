package com.devbuild.gestion_charite.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.devbuild.gestion_charite.entity.enums.ActionStatus;
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
@Table(name = "charity_actions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CharityAction {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String title;

	@Column(length = 2000)
	private String description;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal targetAmount;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal collectedAmount;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private ActionStatus status;

	@Column(nullable = false)
	private Long organizationId;

	@Column(nullable = false)
	private String organizationName;

	@Column(nullable = false)
	private String categoryName;

	private LocalDate startDate;

	private LocalDate endDate;

	private String location;

	@Column(length = 2000)
	private String mediaUrls;

    public void setGoalAmount(BigDecimal bigDecimal) {
    }

	public void setOrganization(Organization organization) {
	}

	public void setCategory(String education) {
	}
}
