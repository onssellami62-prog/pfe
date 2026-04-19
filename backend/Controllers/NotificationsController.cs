using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Notifications?userId=1
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Notification>>> GetNotifications([FromQuery] int userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .ToListAsync();

            return Ok(notifications);
        }

        // GET: api/Notifications/unread-count?userId=1
        [HttpGet("unread-count")]
        public async Task<ActionResult<int>> GetUnreadCount([FromQuery] int userId)
        {
            var count = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .CountAsync();

            return Ok(count);
        }

        // PUT: api/Notifications/5/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notif = await _context.Notifications.FindAsync(id);
            if (notif == null) return NotFound();

            notif.IsRead = true;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PUT: api/Notifications/read-all?userId=1
        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead([FromQuery] int userId)
        {
            var unread = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var n in unread)
                n.IsRead = true;

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
