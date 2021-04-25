using System;
using Kyoo.Controllers;

namespace Kyoo.Models.Attributes
{
	/// <summary>
	/// An attribute to inform that the service will be injected automatically by a service provider.
	/// </summary>
	/// <remarks>
	/// It should only be used on <see cref="ITask"/> and will be injected before calling <see cref="ITask.Run"/>
	/// </remarks>
	[AttributeUsage(AttributeTargets.Property)]
	public class InjectedAttribute : Attribute { }
}