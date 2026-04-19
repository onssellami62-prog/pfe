using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ActivitiesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ActivitiesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Activities/recent
        [HttpGet("recent")]
        public async Task<ActionResult<IEnumerable<ActivityLog>>> GetRecentActivities()
        {
            return await _context.ActivityLogs
                .OrderByDescending(a => a.Timestamp)
                .Take(10)
                .ToListAsync();
        }

        // GET: api/Activities
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ActivityLog>>> GetAllActivities()
        {
            return await _context.ActivityLogs
                .OrderByDescending(a => a.Timestamp)
                .ToListAsync();
        }

        // POST: api/Activities
        [HttpPost]
        public async Task<ActionResult<ActivityLog>> PostActivity(ActivityLog activity)
        {
            if (activity.Timestamp == default) 
                activity.Timestamp = DateTime.UtcNow;

            _context.ActivityLogs.Add(activity);
            await _context.SaveChangesAsync();

            return Ok(activity);
        }
    }
}
