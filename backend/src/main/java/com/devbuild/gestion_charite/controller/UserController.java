package com.devbuild.gestion_charite.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devbuild.gestion_charite.entity.User;
import com.devbuild.gestion_charite.entity.enums.Role;
import com.devbuild.gestion_charite.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

	private final UserRepository userRepository;

	public UserController(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@GetMapping
	public List<User> findAll() {
		return userRepository.findAll();
	}

	@PostMapping
	public User create(@RequestBody User user) {
		user.setId(null);
		if (user.getRole() == null) {
			user.setRole(Role.DONOR);
		}
		return userRepository.save(user);
	}
}
