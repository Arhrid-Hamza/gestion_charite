package com.devbuild.gestion_charite.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	@GetMapping("/ping")
	public Map<String, String> ping() {
		return Map.of("message", "Auth API is reachable");
	}
}
