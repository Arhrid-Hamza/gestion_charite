package com.devbuild.gestion_charite.entity;

import com.devbuild.gestion_charite.entity.enums.Role;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Document(collection = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

	@Id
	private Long id;

	private String fullName;

	@Indexed(unique = true)
	private String email;

	@JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
	private String passwordHash;

	private String phone;

	private String address;

	private String preferredLanguage;

	@Indexed(unique = true, sparse = true)
	private String googleSubject;

	private String interests;

	private Long joinedOrganizationId;

	private String joinedOrganizationName;

	private Role role;
}
