package com.devbuild.gestion_charite.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.devbuild.gestion_charite.entity.User;

public interface UserRepository extends MongoRepository<User, Long> {
	boolean existsByEmail(String email);

	java.util.Optional<User> findByEmail(String email);

	java.util.Optional<User> findByGoogleSubject(String googleSubject);
}
