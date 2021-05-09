using System;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Microsoft.AspNetCore.Identity;

namespace Kyoo.Authentication
{
	/// <summary>
	/// An implementation of an <see cref="IUserStore{TUser}"/> that uses an <see cref="IUserRepository"/>.
	/// </summary>
	public class UserStore : IUserStore<User>
	{
		/// <summary>
		/// The user repository used to store users.
		/// </summary>
		private readonly IUserRepository _users;

		/// <summary>
		/// Create a new <see cref="UserStore"/>.
		/// </summary>
		/// <param name="users">The user repository to use</param>
		public UserStore(IUserRepository users)
		{
			_users = users;
		}


		/// <inheritdoc />
		public void Dispose()
		{
			Dispose(true);
			GC.SuppressFinalize(this);
		}

		/// <summary>
		/// Implementation of the IDisposable pattern
		/// </summary>
		/// <param name="disposing">True if this class should be disposed.</param>
		protected virtual void Dispose(bool disposing)
		{
			bool _ = disposing;
			// Not implemented because this class has nothing to dispose.
		}

		/// <inheritdoc />
		public Task<string> GetUserIdAsync(User user, CancellationToken cancellationToken)
		{
			return Task.FromResult(user.ID.ToString());
		}

		/// <inheritdoc />
		public Task<string> GetUserNameAsync(User user, CancellationToken cancellationToken)
		{
			return Task.FromResult(user.Username);
		}

		/// <inheritdoc />
		public Task SetUserNameAsync(User user, string userName, CancellationToken cancellationToken)
		{
			user.Username = userName;
			return Task.CompletedTask;
		}

		/// <inheritdoc />
		public Task<string> GetNormalizedUserNameAsync(User user, CancellationToken cancellationToken)
		{
			return Task.FromResult(user.Slug);
		}

		/// <inheritdoc />
		public Task SetNormalizedUserNameAsync(User user, string normalizedName, CancellationToken cancellationToken)
		{
			user.Slug = normalizedName;
			return Task.CompletedTask;
		}

		/// <inheritdoc />
		public async Task<IdentityResult> CreateAsync(User user, CancellationToken cancellationToken)
		{
			try
			{
				await _users.Create(user);
				return IdentityResult.Success;
			}
			catch (Exception ex)
			{
				return IdentityResult.Failed(new IdentityError {Code = ex.GetType().Name, Description = ex.Message});
			}
		}

		/// <inheritdoc />
		public async Task<IdentityResult> UpdateAsync(User user, CancellationToken cancellationToken)
		{
			try
			{
				await _users.Edit(user, false);
				return IdentityResult.Success;
			}
			catch (Exception ex)
			{
				return IdentityResult.Failed(new IdentityError {Code = ex.GetType().Name, Description = ex.Message});
			}
		}

		/// <inheritdoc />
		public async Task<IdentityResult> DeleteAsync(User user, CancellationToken cancellationToken)
		{
			try
			{
				await _users.Delete(user);
				return IdentityResult.Success;
			}
			catch (Exception ex)
			{
				return IdentityResult.Failed(new IdentityError {Code = ex.GetType().Name, Description = ex.Message});
			}
		}

		/// <inheritdoc />
		public Task<User> FindByIdAsync(string userId, CancellationToken cancellationToken)
		{
			return _users.GetOrDefault(int.Parse(userId));
		}

		/// <inheritdoc />
		public Task<User> FindByNameAsync(string normalizedUserName, CancellationToken cancellationToken)
		{
			return _users.GetOrDefault(normalizedUserName);
		}
	}
}