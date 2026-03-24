package com.devbuild.gestion_charite.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.devbuild.gestion_charite.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {
}
