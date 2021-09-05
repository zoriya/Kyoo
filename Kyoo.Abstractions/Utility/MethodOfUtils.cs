using System;
using System.Reflection;

namespace Kyoo.Utils
{
	/// <summary>
	/// Static class containing MethodOf calls.
	/// </summary>
	public static class MethodOfUtils
	{
		/// <summary>
		/// Get a MethodInfo from a direct method.
		/// </summary>
		/// <param name="action">The method (without any arguments or return value.</param>
		/// <returns>The <see cref="MethodInfo"/> of the given method</returns>
		public static MethodInfo MethodOf(Action action)
		{
			return action.Method;
		}

		/// <summary>
		/// Get a MethodInfo from a direct method.
		/// </summary>
		/// <param name="action">The method (without any arguments or return value.</param>
		/// <typeparam name="T">The first parameter of the action.</typeparam>
		/// <returns>The <see cref="MethodInfo"/> of the given method</returns>
		public static MethodInfo MethodOf<T>(Action<T> action)
		{
			return action.Method;
		}

		/// <summary>
		/// Get a MethodInfo from a direct method.
		/// </summary>
		/// <param name="action">The method (without any arguments or return value.</param>
		/// <typeparam name="T">The first parameter of the action.</typeparam>
		/// <typeparam name="T2">The second parameter of the action.</typeparam>
		/// <returns>The <see cref="MethodInfo"/> of the given method</returns>
		public static MethodInfo MethodOf<T, T2>(Action<T, T2> action)
		{
			return action.Method;
		}

		/// <summary>
		/// Get a MethodInfo from a direct method.
		/// </summary>
		/// <param name="action">The method (without any arguments or return value.</param>
		/// <typeparam name="T">The first parameter of the action.</typeparam>
		/// <typeparam name="T2">The second parameter of the action.</typeparam>
		/// <typeparam name="T3">The third parameter of the action.</typeparam>
		/// <returns>The <see cref="MethodInfo"/> of the given method</returns>
		public static MethodInfo MethodOf<T, T2, T3>(Action<T, T2, T3> action)
		{
			return action.Method;
		}

		/// <summary>
		/// Get a MethodInfo from a direct method.
		/// </summary>
		/// <param name="action">The method (without any arguments or return value.</param>
		/// <typeparam name="T">The return type of function.</typeparam>
		/// <returns>The <see cref="MethodInfo"/> of the given method</returns>
		public static MethodInfo MethodOf<T>(Func<T> action)
		{
			return action.Method;
		}

		/// <summary>
		/// Get a MethodInfo from a direct method.
		/// </summary>
		/// <param name="action">The method (without any arguments or return value.</param>
		/// <typeparam name="T">The first parameter of the function.</typeparam>
		/// <typeparam name="T2">The return type of function.</typeparam>
		/// <returns>The <see cref="MethodInfo"/> of the given method</returns>
		public static MethodInfo MethodOf<T, T2>(Func<T, T2> action)
		{
			return action.Method;
		}

		/// <summary>
		/// Get a MethodInfo from a direct method.
		/// </summary>
		/// <param name="action">The method (without any arguments or return value.</param>
		/// <typeparam name="T">The first parameter of the function.</typeparam>
		/// <typeparam name="T2">The second parameter of the function.</typeparam>
		/// <typeparam name="T3">The return type of function.</typeparam>
		/// <returns>The <see cref="MethodInfo"/> of the given method</returns>
		public static MethodInfo MethodOf<T, T2, T3>(Func<T, T2, T3> action)
		{
			return action.Method;
		}

		/// <summary>
		/// Get a MethodInfo from a direct method.
		/// </summary>
		/// <param name="action">The method (without any arguments or return value.</param>
		/// <typeparam name="T">The first parameter of the function.</typeparam>
		/// <typeparam name="T2">The second parameter of the function.</typeparam>
		/// <typeparam name="T3">The third parameter of the function.</typeparam>
		/// <typeparam name="T4">The return type of function.</typeparam>
		/// <returns>The <see cref="MethodInfo"/> of the given method</returns>
		public static MethodInfo MethodOf<T, T2, T3, T4>(Func<T, T2, T3, T4> action)
		{
			return action.Method;
		}
	}
}
