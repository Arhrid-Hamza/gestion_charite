package com.devbuild.gestion_charite.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.devbuild.gestion_charite.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
	boolean existsByEmail(String email);

	java.util.Optional<User> findByEmail(String email);

	java.util.Optional<User> findByGoogleSubject(String googleSubject);
}
