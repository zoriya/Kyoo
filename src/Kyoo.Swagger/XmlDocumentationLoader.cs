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

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Xml.Linq;
using System.Xml.XPath;
using Microsoft.Extensions.DependencyInjection;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Kyoo.Swagger
{
	/// <summary>
	/// A static class containing a custom way to include XML to Swagger.
	/// </summary>
	public static class XmlDocumentationLoader
	{
		/// <summary>
		/// Inject human-friendly descriptions for Operations, Parameters and Schemas based on XML Comment files
		/// </summary>
		/// <param name="options">The swagger generator to add documentation to.</param>
		public static void LoadXmlDocumentation(this SwaggerGenOptions options)
		{
			ICollection<XDocument> docs = Directory.GetFiles(AppContext.BaseDirectory, "*.xml")
				.Select(XDocument.Load)
				.ToList();
			Dictionary<string, XElement> elements = docs
				.SelectMany(x => x.XPathSelectElements("/doc/members/member[@name and not(inheritdoc)]"))
				.ToDictionary(x => x.Attribute("name")!.Value, x => x);

			foreach (XElement doc in docs
				.SelectMany(x => x.XPathSelectElements("/doc/members/member[inheritdoc[@cref]]")))
			{
				if (elements.TryGetValue(doc.Attribute("cref")!.Value, out XElement member))
					doc.Element("inheritdoc")!.ReplaceWith(member);
			}
			foreach (XElement doc in docs.SelectMany(x => x.XPathSelectElements("//see[@cref]")))
			{
				string fullName = doc.Attribute("cref")!.Value;
				string shortName = fullName[(fullName.LastIndexOf('.') + 1)..];
				// TODO won't work with fully qualified methods.
				if (fullName.StartsWith("M:"))
					shortName += "()";
				doc.ReplaceWith(shortName);
			}

			foreach (XDocument doc in docs)
				options.IncludeXmlComments(() => new XPathDocument(doc.CreateReader()), true);
		}
	}
}
