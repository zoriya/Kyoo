using System;
using System.Collections.Generic;
using System.Linq;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Unity;

namespace Kyoo.Controllers
{
	/// <summary>
	/// A common interface used to discord plugins
	/// </summary>
	/// <remarks>You can inject services in the IPlugin constructor.
	/// You should only inject well known services like an ILogger, IConfiguration or IWebHostEnvironment.</remarks>
	[UsedImplicitly(ImplicitUseTargetFlags.WithInheritors)]
	public interface IPlugin
	{
		/// <summary>
		/// A slug to identify this plugin in queries.
		/// </summary>
		string Slug { get; }
		
		/// <summary>
		/// The name of the plugin
		/// </summary>
		string Name { get; }
		
		/// <summary>
		/// The description of this plugin. This will be displayed on the "installed plugins" page.
		/// </summary>
		string Description { get; }
		
		/// <summary>
		/// A list of services that are provided by this service. This allow other plugins to declare dependencies
		/// </summary>
		/// <remarks>
		/// You should put the type's interface that will be register in configure.
		/// </remarks>
		ICollection<Type> Provides { get; }
		
		/// <summary>
		/// A list of types that will be provided only if a condition is met. The condition can be an arbitrary method or
		/// a condition based on other type availability. For more information, see <see cref="ConditionalProvides"/>.
		/// </summary>
		ICollection<ConditionalProvide> ConditionalProvides { get; }

		/// <summary>
		/// A list of services that are required by this plugin.
		/// You can put services that you provide conditionally here if you want.
		/// Kyoo will warn the user that this plugin can't be loaded if a required service is not found.
		/// </summary>
		/// <remarks>
		/// Put here the most complete type that are needed for your plugin to work. If you need a LibraryManager,
		/// put typeof(ILibraryManager).
		/// </remarks>
		ICollection<Type> Requires { get; }

		/// <summary>
		/// A configure method that will be run on plugin's startup.
		/// </summary>
		/// <param name="container">A unity container to register new services.</param>
		/// <param name="availableTypes">The list of types that are available for this instance. This can be used
		/// for conditional type. See <see cref="ProviderCondition.Has(System.Type,System.Collections.Generic.ICollection{System.Type})"/>
		/// or <see cref="ProviderCondition.Has(System.Collections.Generic.ICollection{System.Type},System.Collections.Generic.ICollection{System.Type})"/>></param>
		void Configure(IUnityContainer container, ICollection<Type> availableTypes) {}

		/// <summary>
		/// An optional configure method that will be run on plugin's startup.
		/// This method may be used instead or with the
		/// <see cref="Configure(Unity.IUnityContainer,System.Collections.Generic.ICollection{System.Type})"/> method
		/// if you use a library that configure itself with a <see cref="IServiceCollection"/>.
		/// Every service put in this container will be registered to the unity container after this method.
		/// </summary>
		/// <param name="services">An empty service container to register new services.</param>
		/// <param name="availableTypes">The list of types that are available for this instance. This can be used
		/// for conditional type. See <see cref="ProviderCondition.Has(System.Type,System.Collections.Generic.ICollection{System.Type})"/>
		/// or <see cref="ProviderCondition.Has(System.Collections.Generic.ICollection{System.Type},System.Collections.Generic.ICollection{System.Type})"/>></param>
		/// <returns>You should return the <see cref="services"/> parameter or another container if you want.
		/// This container will be added to Kyoo's unity container.</returns>
		IServiceCollection Configure(IServiceCollection services, ICollection<Type> availableTypes)
		{
			return services;
		}
		
		/// <summary>
		/// An optional configuration step to allow a plugin to change asp net configurations.
		/// WARNING: This is only called on Kyoo's startup so you must restart the app to apply this changes.
		/// </summary>
		/// <param name="app">The Asp.Net application builder. On most case it is not needed but you can use it to add asp net functionalities.</param>
		void ConfigureAspNet(IApplicationBuilder app) {}
	}

	/// <summary>
	/// A type that will only be provided if a special condition is met. To check that your condition is met,
	/// you can check the <see cref="ProviderCondition"/> class.
	/// </summary>
	public class ConditionalProvide : Tuple<Type, ProviderCondition>
	{
		/// <summary>
		/// Get the type that may be provided
		/// </summary>
		public Type Type => Item1;

		/// <summary>
		/// Get the condition.
		/// </summary>
		public ProviderCondition Condition => Item2;
		
		/// <summary>
		/// Create a <see cref="ConditionalProvide"/> from a type and a condition.
		/// </summary>
		/// <param name="type">The type to provide</param>
		/// <param name="condition">The condition</param>
		public ConditionalProvide(Type type, ProviderCondition condition) 
			: base(type, condition) 
		{ }

		/// <summary>
		/// Create a <see cref="ConditionalProvide"/> from a tuple of (Type, ProviderCondition).
		/// </summary>
		/// <param name="tuple">The tuple to convert</param>
		public ConditionalProvide((Type type, ProviderCondition condition) tuple)
			: base(tuple.type, tuple.condition)
		{ }

		/// <summary>
		/// Implicitly convert a tuple to a <see cref="ConditionalProvide"/>.
		/// </summary>
		/// <param name="tuple">The tuple to convert</param>
		/// <returns>A new <see cref="ConditionalProvide"/> based on the given tuple.</returns>
		public static implicit operator ConditionalProvide((Type, Type) tuple) => new (tuple);
	}
	
	/// <summary>
	/// A condition for a conditional type.
	/// </summary>
	public class ProviderCondition
	{
		/// <summary>
		/// The condition as a method. If true is returned, the type will be provided.
		/// </summary>
		public Func<bool> Condition { get; } = () => true;  
		/// <summary>
		/// The list of types that this method needs.
		/// </summary>
		public ICollection<Type> Needed { get; } = ArraySegment<Type>.Empty;

		
		/// <summary>
		/// Create a new <see cref="ProviderCondition"/> from a raw function.
		/// </summary>
		/// <param name="condition">The predicate that will be used as condition</param>
		public ProviderCondition(Func<bool> condition)
		{
			Condition = condition;
		}
		
		/// <summary>
		/// Create a new <see cref="ProviderCondition"/> from a type. This allow you to inform that a type will
		/// only be available if a dependency is met.
		/// </summary>
		/// <param name="needed">The type that you need</param>
		public ProviderCondition(Type needed)
		{
			Needed = new[] {needed};
		}

		/// <summary>
		/// Create a new <see cref="ProviderCondition"/> from a list of type. This allow you to inform that a type will
		/// only be available if a list of dependencies are met.
		/// </summary>
		/// <param name="needed">The types that you need</param>
		public ProviderCondition(ICollection<Type> needed)
		{
			Needed = needed;
		}

		/// <summary>
		/// Create a new <see cref="ProviderCondition"/> with a list of types as dependencies and a predicate
		/// for arbitrary conditions.
		/// </summary>
		/// <param name="needed">The list of dependencies</param>
		/// <param name="condition">An arbitrary condition</param>
		public ProviderCondition(ICollection<Type> needed, Func<bool> condition)
		{
			Needed = needed;
			Condition = condition;
		}

		
		/// <summary>
		/// Implicitly convert a type to a <see cref="ProviderCondition"/>. 
		/// </summary>
		/// <param name="type">The type dependency</param>
		/// <returns>A <see cref="ProviderCondition"/> that will return true if the given type is available.</returns>
		public static implicit operator ProviderCondition(Type type) => new(type);
		
		/// <summary>
		/// Implicitly convert a list of type to a <see cref="ProviderCondition"/>. 
		/// </summary>
		/// <param name="types">The list of type dependencies</param>
		/// <returns>A <see cref="ProviderCondition"/> that will return true if the given types are available.</returns>
		public static implicit operator ProviderCondition(Type[] types) => new(types);
		
		/// <inheritdoc cref="op_Implicit(System.Type[])"/>
		public static implicit operator ProviderCondition(List<Type> types) => new(types);
		
		
		/// <summary>
		/// Check if a type is available.
		/// </summary>
		/// <param name="needed">The type to check</param>
		/// <param name="available">The list of types</param>
		/// <returns>True if the dependency is met, false otherwise</returns>
		public static bool Has(Type needed, ICollection<Type> available)
		{
			return available.Contains(needed);
		}
		
		/// <summary>
		/// Check if a list of type are available.
		/// </summary>
		/// <param name="needed">The list of types to check</param>
		/// <param name="available">The list of types</param>
		/// <returns>True if the dependencies are met, false otherwise</returns>
		public static bool Has(ICollection<Type> needed, ICollection<Type> available)
		{
			return needed.All(x => Has(x, available));
		}
	}
}