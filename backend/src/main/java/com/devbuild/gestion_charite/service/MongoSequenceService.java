package com.devbuild.gestion_charite.service;

import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import com.devbuild.gestion_charite.entity.DatabaseSequence;

@Service
public class MongoSequenceService {
	private final MongoOperations mongoOperations;

	public MongoSequenceService(MongoOperations mongoOperations) {
		this.mongoOperations = mongoOperations;
	}

	public Long nextId(String sequenceName) {
		DatabaseSequence sequence = mongoOperations.findAndModify(
				Query.query(Criteria.where("_id").is(sequenceName)),
				new Update().inc("value", 1),
				FindAndModifyOptions.options().returnNew(true).upsert(true),
				DatabaseSequence.class
		);

		return sequence == null ? 1L : sequence.getValue();
	}

	public void resetSequence(String sequenceName, long value) {
		mongoOperations.save(new DatabaseSequence(sequenceName, value));
	}
}