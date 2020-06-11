using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Kyoo.Controllers
{
	public static class Helper
	{
		public static bool IsDuplicateException(DbUpdateException ex)
		{
			return ex.InnerException is PostgresException inner
			       && inner.SqlState == PostgresErrorCodes.UniqueViolation;
		}
	}
}