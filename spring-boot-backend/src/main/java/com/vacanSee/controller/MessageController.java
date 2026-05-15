package com.vacanSee.controller;

import com.vacanSee.model.Conversation;
import com.vacanSee.model.Message;
import com.vacanSee.repository.ConversationRepository;
import com.vacanSee.repository.MessageRepository;
import com.vacanSee.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private UserRepository userRepository;

    // Get all messages
    @GetMapping
    public ResponseEntity<?> getAllMessages() {
        return ResponseEntity.ok(messageRepository.findAll());
    }

    // Get message by ID
    @GetMapping("/{id}")
    @SuppressWarnings("null")
    public ResponseEntity<?> getMessage(@PathVariable Long id) {
        var message = messageRepository.findById(id);
        if (message.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Message not found"));
        }
        return ResponseEntity.ok(message.get());
    }

    // Create message
    @PostMapping
    @SuppressWarnings("null")
    public ResponseEntity<?> createMessage(@RequestBody Message message) {
        var conversation = conversationRepository.findById(message.getConversation().getId());
        var sender = userRepository.findById(message.getSender().getId());

        if (conversation.isEmpty() || sender.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Conversation or Sender not found"));
        }

        message.setConversation(conversation.get());
        message.setSender(sender.get());
        message.setIsRead(false);

        Message savedMessage = messageRepository.save(message);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedMessage);
    }

    // Get messages by conversation
    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<?> getMessagesByConversation(@PathVariable Long conversationId) {
        List<Message> messages = messageRepository.findByConversationId(conversationId);
        return ResponseEntity.ok(messages);
    }

    // Get conversations by user
    @GetMapping("/conversations/{userId}")
    public ResponseEntity<?> getConversationsByUser(@PathVariable Long userId) {
        List<Conversation> conversations = conversationRepository.findByParticipantsId(userId);
        return ResponseEntity.ok(conversations);
    }

    // Create conversation
    @PostMapping("/conversations")
    public ResponseEntity<?> createConversation(@RequestBody Conversation conversation) {
        Conversation savedConversation = conversationRepository.save(conversation);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedConversation);
    }

    // Delete message
    @DeleteMapping("/{id}")
    @SuppressWarnings("null")
    public ResponseEntity<?> deleteMessage(@PathVariable Long id) {
        if (!messageRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Message not found"));
        }
        messageRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Message deleted successfully"));
    }
}
