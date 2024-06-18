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

using Kyoo.Abstractions.Controllers;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RabbitMQ.Client;

namespace Kyoo.RabbitMq;

public static class RabbitMqModule
{
	public static void ConfigureRabbitMq(this WebApplicationBuilder builder)
	{
		builder.Services.AddSingleton(_ =>
		{
			ConnectionFactory factory =
				new()
				{
					UserName = builder.Configuration.GetValue("RABBITMQ_DEFAULT_USER", "guest"),
					Password = builder.Configuration.GetValue("RABBITMQ_DEFAULT_PASS", "guest"),
					HostName = builder.Configuration.GetValue("RABBITMQ_HOST", "rabbitmq"),
					Port = builder.Configuration.GetValue("RABBITMQ_PORT", 5672),
				};

			return factory.CreateConnection();
		});
		builder.Services.AddSingleton<RabbitProducer>();
		builder.Services.AddSingleton<IScanner, ScannerProducer>();
	}
}
