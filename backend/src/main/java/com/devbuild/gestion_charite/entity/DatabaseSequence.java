package com.devbuild.gestion_charite.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Document(collection = "database_sequences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DatabaseSequence {
	@Id
	private String id;
	private long value;
}