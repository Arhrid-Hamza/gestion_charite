package com.devbuild.gestion_charite.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.devbuild.gestion_charite.entity.Category;

public interface CategoryRepository extends MongoRepository<Category, Long> {
}
