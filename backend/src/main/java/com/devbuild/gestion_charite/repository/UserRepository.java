package com.devbuild.gestion_charite.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.devbuild.gestion_charite.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
}
