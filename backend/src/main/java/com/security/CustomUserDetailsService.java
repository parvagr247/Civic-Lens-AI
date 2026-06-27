package com.security;

import com.model.User;
import com.repository.UserFirestoreRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * Custom adapter mapping our Firestore User entity to Spring Security's UserDetails.
 */
@Slf4j
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserFirestoreRepository userRepository;

    public CustomUserDetailsService(UserFirestoreRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.info("Security: Resolving UserDetails for email: {}", email);
        
        User user = userRepository.findByEmail(email);
        if (user == null) {
            log.warn("Security: Username '{}' not found in Firestore registry", email);
            throw new UsernameNotFoundException("User not found with email: " + email);
        }

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name()))
        );
    }
}
