package com.devbuild.gestion_charite.entity;

import com.devbuild.gestion_charite.entity.enums.OrganizationStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
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
@Table(name = "organizations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Organization {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private String name;

	@Column(nullable = false)
	private String legalAddress;

	@Column(nullable = false, unique = true)
	private String taxIdentificationNumber;

	@Column(nullable = false)
	private String primaryContactName;

	@Column(nullable = false)
	private String primaryContactEmail;

	@JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
	@Column(nullable = true)
	private String password;

	private String primaryContactPhone;

	private String logoUrl;

	@Column(length = 1000)
	private String description;

	@Column(length = 1500)
	private String mission;

	@Column
	private Long adminUserId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private OrganizationStatus status;
}
