package com.devbuild.gestion_charite.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.devbuild.gestion_charite.entity.CharityAction;

public interface CharityActionRepository extends JpaRepository<CharityAction, Long> {
}
