package com.jhub.backend.repository;

import com.jhub.backend.model.Note;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NoteRepository extends JpaRepository<Note, UUID> {

  List<Note> findByJobApplicationIdOrderByCreatedAtDesc(UUID jobApplicationId);

  /** Follow-up notes for a user due within a date range, soonest first (dashboard). */
  @Query(
      """
      select n from Note n
      where n.jobApplication.user.id = :userId
        and n.followUp = true
        and n.followUpDate between :from and :to
      order by n.followUpDate asc
      """)
  List<Note> findFollowUpsDueBetween(
      @Param("userId") UUID userId, @Param("from") LocalDate from, @Param("to") LocalDate to);
}
