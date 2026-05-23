package com.devbuild.gestion_charite.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Document(collection = "participations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Participation {

	@Id
	private Long id;

	private String participantName;

	private Long participantUserId;

	private Long actionId;

	private String actionTitle;

	private String roleInAction;

	private LocalDateTime joinedAt;
}
