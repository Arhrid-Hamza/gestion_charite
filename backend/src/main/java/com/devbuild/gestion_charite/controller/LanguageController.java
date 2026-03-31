package com.devbuild.gestion_charite.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/languages")
public class LanguageController {

	@GetMapping
	public List<String> getLanguages() {
		return List.of("fr", "ar");
	}
}
