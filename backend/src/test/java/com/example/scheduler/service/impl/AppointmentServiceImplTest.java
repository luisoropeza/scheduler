package com.example.scheduler.service.impl;

import com.example.scheduler.dto.appointment.AppointmentRequest;
import com.example.scheduler.entity.Appointment;
import com.example.scheduler.entity.DoctorAvailability;
import com.example.scheduler.entity.Patient;
import com.example.scheduler.entity.Personal;
import com.example.scheduler.enums.AppointmentStatus;
import com.example.scheduler.exception.BusinessException;
import com.example.scheduler.mapper.AppointmentMapper;
import com.example.scheduler.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceImplTest {
    private static final long DOCTOR_ID = 7L;
    private static final LocalDateTime START = LocalDateTime.of(2026, 10, 12, 9, 0);
    private static final LocalDateTime END = START.plusMinutes(30);

    @Mock AppointmentRepository appointmentRepository;
    @Mock PatientRepository patientRepository;
    @Mock PersonalRepository personalRepository;
    @Mock AppointmentMapper appointmentMapper;
    @Mock ScheduleExceptionRepository scheduleExceptionRepository;
    @Mock DoctorAvailabilityRepository doctorAvailabilityRepository;
    @InjectMocks AppointmentServiceImpl service;

    private final AppointmentRequest request = new AppointmentRequest(DOCTOR_ID, 99L, START, END);

    @BeforeEach
    void freeSlot() {
        when(doctorAvailabilityRepository.findByDoctorIdAndDayOfWeekAndActiveTrue(DOCTOR_ID, START.getDayOfWeek()))
                .thenReturn(List.of(DoctorAvailability.builder().startTime(LocalTime.of(8, 0)).endTime(LocalTime.of(13, 0)).build()));
    }

    @Test
    void bookAppointment_should_forceCallerAndPending_when_patient() {
        stubSave();

        service.bookAppointment(request, 5L, "PATIENT");

        verify(patientRepository).getReferenceById(5L);
        assertThat(savedAppointment().getStatus()).isEqualTo(AppointmentStatus.PENDING);
    }

    @Test
    void bookAppointment_should_useBodyPatientAndPending_when_staff() {
        stubSave();

        service.bookAppointment(request, 1L, "ASSISTANT");

        verify(patientRepository).getReferenceById(99L);
        assertThat(savedAppointment().getStatus()).isEqualTo(AppointmentStatus.PENDING);
    }

    @Test
    void bookAppointment_should_throwConflict_when_slotOverlapsActiveAppointment() {
        when(appointmentRepository.existsOverlappingAppointment(DOCTOR_ID, START, END, List.of(AppointmentStatus.CANCELLED)))
                .thenReturn(true);

        assertThatThrownBy(() -> service.bookAppointment(request, 5L, "PATIENT"))
                .isInstanceOf(BusinessException.class);
        verify(appointmentRepository, never()).save(any());
    }

    private void stubSave() {
        when(personalRepository.getReferenceById(DOCTOR_ID)).thenReturn(new Personal());
        when(patientRepository.getReferenceById(anyLong())).thenReturn(new Patient());
        when(appointmentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private Appointment savedAppointment() {
        var captor = ArgumentCaptor.forClass(Appointment.class);
        verify(appointmentRepository).save(captor.capture());
        return captor.getValue();
    }
}
