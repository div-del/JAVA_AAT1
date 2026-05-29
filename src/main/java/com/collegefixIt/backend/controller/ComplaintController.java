package com.collegefixIt.backend.controller;

import com.collegefixIt.backend.model.Complaint;
import com.collegefixIt.backend.repository.ComplaintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/complaints")
@CrossOrigin(origins = "*")
public class ComplaintController {

    @Autowired
    private ComplaintRepository complaintRepository;

    @PostMapping
    public String submitComplaint(@RequestBody Complaint complaint) {
        complaintRepository.save(complaint);
        return "Complaint submitted!";
    }

    @GetMapping("/user/{id}")
    public List<Complaint> getMyComplaints(@PathVariable Long id) {
        return complaintRepository.findByUserId(id);
    }

    @GetMapping("/all")
    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }

    @PutMapping("/{id}")
    public String updateStatus(@PathVariable Long id, @RequestBody Complaint update) {
        Complaint complaint = complaintRepository.findById(id).orElseThrow();
        complaint.setStatus(update.getStatus());
        complaintRepository.save(complaint);
        return "Status updated!";
    }
}
