package com.devbuild.gestion_charite.entity;

import com.devbuild.gestion_charite.entity.enums.OrganizationStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Document(collection = "organizations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Organization {

	@Id
	private Long id;

	@Indexed(unique = true)
	private String name;

	private String legalAddress;

	@Indexed(unique = true)
	private String taxIdentificationNumber;

	private String primaryContactName;

	private String primaryContactEmail;

	@JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
	private String password;

	private String primaryContactPhone;

	private String logoUrl;

	private String description;

	private String mission;

	private Long adminUserId;

	private OrganizationStatus status;
}
