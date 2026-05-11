package com.devbuild.gestion_charite.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.devbuild.gestion_charite.entity.enums.ActionStatus;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Document(collection = "charity_actions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CharityAction {

	@Id
	private Long id;

	private String title;

	private String description;

	private BigDecimal targetAmount;

	private BigDecimal collectedAmount;

	private ActionStatus status;

	private Long organizationId;

	private String organizationName;

	private String categoryName;

	private LocalDate startDate;

	private LocalDate endDate;

	private String location;

	private String image;

	private String mediaUrls;

    public void setGoalAmount(BigDecimal bigDecimal) {
    }

	public void setOrganization(Organization organization) {
	}

	public void setCategory(String education) {
	}
}
