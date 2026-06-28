package com.dto;

import com.model.CitizenProfile;
import com.model.Incident;
import com.model.Comment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private CitizenProfile profile;
    private Integer followerCount;
    private Integer followingCount;
    private Boolean isFollowing;
    private List<Incident> reportedIncidents;
    private List<Comment> comments;
}
