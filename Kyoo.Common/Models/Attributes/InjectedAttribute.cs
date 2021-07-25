using System;
using JetBrains.Annotations;
using Kyoo.Controllers;

namespace Kyoo.Models.Attributes
{
	/// <summary>
	/// An attribute to inform that the service will be injected automatically by a service provider.
	/// </summary>
	/// <remarks>
	/// It should only be used on <see cref="IPlugin"/> and it will be injected before
	/// calling <see cref="IPlugin.ConfigureAspNet"/>.
	/// </remarks>
	[AttributeUsage(AttributeTargets.Property)]
	[MeansImplicitUse(ImplicitUseKindFlags.Assign)]
	public class InjectedAttribute : Attribute { }
}