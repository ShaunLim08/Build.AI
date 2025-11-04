(function() {
  'use strict';

  // Build.AI Chatbot Widget
  // Version: 1.0.0

  class BuildAIChatbot {
    constructor(config) {
      this.chatbotId = config.chatbotId;
      this.position = config.position || 'bottom-right';
      this.theme = config.theme || 'dark';
      this.primaryColor = config.primaryColor || '#6366f1';
      this.backgroundColor = config.backgroundColor || '#0a0808';
      this.textColor = config.textColor || '#ffffff';
      this.showWatermark = config.showWatermark !== false;
      this.baseUrl = config.baseUrl || window.location.origin;
      this.persistConversations = config.persistConversations !== false;
      this.apiKey = config.apiKey || null;

      this.iframe = null;
      this.button = null;
      this.isOpen = false;
      this.sessionId = null;
      this.storageKey = `buildai_chatbot_${this.chatbotId}`;
      this.unreadCount = 0;

      this.init();
    }

    init() {
      // Load or create session
      this.loadSession();

      // Create floating button
      this.createButton();

      // Create iframe (hidden initially)
      this.createIframe();

      // Add event listeners
      this.attachEventListeners();

      // Restore widget state
      this.restoreState();
    }

    // Generate unique session ID
    generateSessionId() {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Load session from localStorage
    loadSession() {
      if (!this.persistConversations) {
        this.sessionId = this.generateSessionId();
        return;
      }

      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const data = JSON.parse(stored);

          // Check if session is less than 24 hours old
          const sessionAge = Date.now() - data.timestamp;
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours

          if (sessionAge < maxAge && data.sessionId) {
            this.sessionId = data.sessionId;
            this.isOpen = data.isOpen || false;
            this.unreadCount = data.unreadCount || 0;
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to load widget session:', error);
      }

      // Create new session if none exists or expired
      this.sessionId = this.generateSessionId();
      this.saveSession();
    }

    // Save session to localStorage
    saveSession() {
      if (!this.persistConversations) return;

      try {
        const data = {
          sessionId: this.sessionId,
          isOpen: this.isOpen,
          unreadCount: this.unreadCount,
          timestamp: Date.now(),
        };
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save widget session:', error);
      }
    }

    // Clear session from localStorage
    clearSession() {
      try {
        localStorage.removeItem(this.storageKey);
        this.sessionId = this.generateSessionId();
        this.saveSession();
      } catch (error) {
        console.warn('Failed to clear widget session:', error);
      }
    }

    // Restore widget state (open/closed)
    restoreState() {
      if (this.isOpen) {
        setTimeout(() => this.open(), 100);
      }
      // Update badge if there are unread messages
      if (this.unreadCount > 0) {
        this.updateBadge();
      }
    }

    // Update unread message badge
    updateBadge() {
      let badge = this.button.querySelector('.buildai-badge');

      if (this.unreadCount > 0 && !this.isOpen) {
        if (!badge) {
          badge = document.createElement('div');
          badge.className = 'buildai-badge';
          Object.assign(badge.style, {
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 'bold',
            border: '2px solid #ffffff',
            zIndex: '1',
          });
          this.button.appendChild(badge);
        }
        badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount.toString();
      } else if (badge) {
        badge.remove();
      }

      this.saveSession();
    }

    // Increment unread count
    incrementUnread() {
      if (!this.isOpen) {
        this.unreadCount++;
        this.updateBadge();
      }
    }

    // Clear unread count
    clearUnread() {
      this.unreadCount = 0;
      this.updateBadge();
    }

    createButton() {
      this.button = document.createElement('button');
      this.button.id = 'buildai-chat-button';
      this.button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;

      // Position styles
      const positions = {
        'bottom-right': { bottom: '20px', right: '20px' },
        'bottom-left': { bottom: '20px', left: '20px' },
        'top-right': { top: '20px', right: '20px' },
        'top-left': { top: '20px', left: '20px' }
      };

      const pos = positions[this.position] || positions['bottom-right'];

      Object.assign(this.button.style, {
        position: 'fixed',
        ...pos,
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: this.primaryColor,
        color: '#ffffff',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: '999998',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s, box-shadow 0.2s',
        outline: 'none'
      });

      this.button.onmouseenter = () => {
        this.button.style.transform = 'scale(1.1)';
        this.button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
      };

      this.button.onmouseleave = () => {
        this.button.style.transform = 'scale(1)';
        this.button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      };

      document.body.appendChild(this.button);
    }

    createIframe() {
      this.iframe = document.createElement('iframe');
      this.iframe.id = 'buildai-chat-iframe';

      // Build embed URL with styling parameters
      const bg = this.backgroundColor.replace('#', '');
      const text = this.textColor.replace('#', '');
      const button = this.primaryColor.replace('#', '');

      // Add sessionId and apiKey to URL parameters
      const params = new URLSearchParams({
        bg,
        text,
        button,
        watermark: this.showWatermark.toString(),
        sessionId: this.sessionId,
      });

      if (this.apiKey) {
        params.append('apiKey', this.apiKey);
      }

      const embedUrl = `${this.baseUrl}/embed/${this.chatbotId}?${params.toString()}`;

      this.iframe.src = embedUrl;

      // Position based on button position
      const positions = {
        'bottom-right': { bottom: '90px', right: '20px' },
        'bottom-left': { bottom: '90px', left: '20px' },
        'top-right': { top: '90px', right: '20px' },
        'top-left': { top: '90px', left: '20px' }
      };

      const pos = positions[this.position] || positions['bottom-right'];

      Object.assign(this.iframe.style, {
        position: 'fixed',
        ...pos,
        width: '400px',
        height: '600px',
        maxHeight: 'calc(100vh - 120px)',
        border: 'none',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        zIndex: '999999',
        display: 'none',
        opacity: '0',
        transform: 'scale(0.95)',
        transition: 'opacity 0.3s, transform 0.3s'
      });

      // Make responsive on mobile
      if (window.innerWidth < 768) {
        Object.assign(this.iframe.style, {
          width: '100%',
          height: '100%',
          maxHeight: '100vh',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          borderRadius: '0'
        });
      }

      document.body.appendChild(this.iframe);
    }

    attachEventListeners() {
      this.button.addEventListener('click', () => this.toggle());

      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });

      // Listen for messages from iframe (for unread count)
      window.addEventListener('message', (event) => {
        // Verify origin for security
        if (event.origin !== this.baseUrl) return;

        if (event.data && event.data.type === 'buildai:newMessage') {
          // New message received while widget is closed
          this.incrementUnread();
        }
      });

      // Handle window resize for responsive behavior
      window.addEventListener('resize', () => {
        if (window.innerWidth < 768) {
          Object.assign(this.iframe.style, {
            width: '100%',
            height: '100%',
            maxHeight: '100vh',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            borderRadius: '0'
          });
        } else {
          const positions = {
            'bottom-right': { bottom: '90px', right: '20px' },
            'bottom-left': { bottom: '90px', left: '20px' },
            'top-right': { top: '90px', right: '20px' },
            'top-left': { top: '90px', left: '20px' }
          };
          const pos = positions[this.position] || positions['bottom-right'];

          Object.assign(this.iframe.style, {
            width: '400px',
            height: '600px',
            maxHeight: 'calc(100vh - 120px)',
            ...pos,
            borderRadius: '12px'
          });
        }
      });
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    open() {
      this.iframe.style.display = 'block';
      // Trigger animation after display is set
      setTimeout(() => {
        this.iframe.style.opacity = '1';
        this.iframe.style.transform = 'scale(1)';
      }, 10);
      this.isOpen = true;
      this.clearUnread(); // Clear unread messages when opening
      this.saveSession(); // Persist open state

      // Update button icon to close
      this.button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    }

    close() {
      this.iframe.style.opacity = '0';
      this.iframe.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.iframe.style.display = 'none';
      }, 300);
      this.isOpen = false;
      this.saveSession(); // Persist closed state

      // Update button icon back to chat
      this.button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
    }

    // Reset conversation (clear session)
    reset() {
      this.clearSession();
      // Reload iframe to start fresh
      const currentSrc = this.iframe.src;
      this.iframe.src = '';
      setTimeout(() => {
        const bg = this.backgroundColor.replace('#', '');
        const text = this.textColor.replace('#', '');
        const button = this.primaryColor.replace('#', '');
        const params = new URLSearchParams({
          bg,
          text,
          button,
          watermark: this.showWatermark.toString(),
          sessionId: this.sessionId,
        });
        if (this.apiKey) {
          params.append('apiKey', this.apiKey);
        }
        this.iframe.src = `${this.baseUrl}/embed/${this.chatbotId}?${params.toString()}`;
      }, 100);
    }

    destroy() {
      if (this.button) this.button.remove();
      if (this.iframe) this.iframe.remove();
    }
  }

  // Expose to global scope
  window.BuildAIChatbot = BuildAIChatbot;

  // Auto-initialize if config is provided in data attribute
  document.addEventListener('DOMContentLoaded', () => {
    const script = document.querySelector('script[data-chatbot-id]');
    if (script) {
      const config = {
        chatbotId: script.getAttribute('data-chatbot-id'),
        position: script.getAttribute('data-position') || 'bottom-right',
        theme: script.getAttribute('data-theme') || 'dark',
        primaryColor: script.getAttribute('data-primary-color') || '#6366f1',
        backgroundColor: script.getAttribute('data-bg-color') || '#0a0808',
        textColor: script.getAttribute('data-text-color') || '#ffffff',
        showWatermark: script.getAttribute('data-watermark') !== 'false',
        persistConversations: script.getAttribute('data-persist') !== 'false',
        apiKey: script.getAttribute('data-api-key') || null,
        baseUrl: script.getAttribute('data-base-url') || window.location.origin
      };

      new BuildAIChatbot(config);
    }
  });
})();
