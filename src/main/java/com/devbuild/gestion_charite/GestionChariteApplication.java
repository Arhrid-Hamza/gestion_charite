package com.devbuild.gestion_charite;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GestionChariteApplication {

	public static void main(String[] args) {
		SpringApplication.run(GestionChariteApplication.class, args);
	}

	CommandLineRunner init(){
		return args -> {
			System.out.println("l'application est demarée !");
		};
	}
}
