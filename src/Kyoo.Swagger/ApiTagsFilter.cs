// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Kyoo.Abstractions.Models.Attributes;
using Namotion.Reflection;
using NSwag;
using NSwag.Generation.AspNetCore;
using NSwag.Generation.Processors.Contexts;

namespace Kyoo.Swagger
{
	/// <summary>
	/// A class to handle Api Groups (OpenApi tags and x-tagGroups).
	/// Tags should be specified via <see cref="ApiDefinitionAttribute"/> and this filter will map this to the
	/// <see cref="OpenApiDocument"/>.
	/// </summary>
	public static class ApiTagsFilter
	{
		/// <summary>
		/// The main operation filter that will map every <see cref="ApiDefinitionAttribute"/>.
		/// </summary>
		/// <param name="context">The processor context, this is given by the AddOperationFilter method.</param>
		/// <returns>This always return <c>true</c> since it should not remove operations.</returns>
		public static bool OperationFilter(OperationProcessorContext context)
		{
			ApiDefinitionAttribute def = context.ControllerType.GetCustomAttribute<ApiDefinitionAttribute>();
			string name = def?.Name ?? context.ControllerType.Name;

			context.OperationDescription.Operation.Tags.Add(name);
			if (context.Document.Tags.All(x => x.Name != name))
			{
				context.Document.Tags.Add(new OpenApiTag
				{
					Name = name,
					Description = context.ControllerType.GetXmlDocsSummary()
				});
			}

			if (def == null)
				return true;

			context.Document.ExtensionData ??= new Dictionary<string, object>();
			context.Document.ExtensionData.TryAdd("x-tagGroups", new List<dynamic>());
			List<dynamic> obj = (List<dynamic>)context.Document.ExtensionData["x-tagGroups"];
			dynamic existing = obj.FirstOrDefault(x => x.name == def.Group);
			if (existing != null)
			{
				if (!existing.tags.Contains(def.Name))
					existing.tags.Add(def.Name);
			}
			else
			{
				obj.Add(new
				{
					name = def.Group,
					tags = new List<string> { def.Name }
				});
			}

			return true;
		}

		/// <summary>
		/// This add every tags that are not in a x-tagGroups to a new tagGroups named "Other".
		/// Since tags that are not in a tagGroups are not shown, this is necessary if you want them displayed.
		/// </summary>
		/// <param name="postProcess">
		/// The document to do this for. This should be done in the PostProcess part of the document or after
		/// the main operation filter (see <see cref="OperationFilter"/>) has finished.
		/// </param>
		public static void AddLeftoversToOthersGroup(this OpenApiDocument postProcess)
		{
			List<dynamic> tagGroups = (List<dynamic>)postProcess.ExtensionData["x-tagGroups"];
			List<string> tagsWithoutGroup = postProcess.Tags
				.Select(x => x.Name)
				.Where(x => tagGroups
					.SelectMany<dynamic, string>(y => y.tags)
					.All(y => y != x))
				.ToList();
			if (tagsWithoutGroup.Any())
			{
				tagGroups.Add(new
				{
					name = "Others",
					tags = tagsWithoutGroup
				});
			}
		}

		/// <summary>
		/// Use <see cref="ApiDefinitionAttribute"/> to create tags and groups of tags on the resulting swagger
		/// document.
		/// </summary>
		/// <param name="options">The settings of the swagger document.</param>
		public static void UseApiTags(this AspNetCoreOpenApiDocumentGeneratorSettings options)
		{
			options.AddOperationFilter(OperationFilter);
			options.PostProcess += x => x.AddLeftoversToOthersGroup();
		}
	}
}
