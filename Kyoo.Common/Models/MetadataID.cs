namespace Kyoo.Models
{
	public class MetadataID
	{
		public string ProviderName;
		public string ProviderLogo;
		public string ID;
		public string Link;

		public MetadataID() { }

		public MetadataID(string providerValue)
		{
			string[] values = providerValue.Split('=');
			ProviderName = values[0];
			ID = values[1];
		}
		
		public MetadataID(string providerName, string id)
		{
			ProviderName = providerName;
			ID = id;
		}
		
		public MetadataID(string providerName, string providerLogo, string id, string link)
		{
			ProviderName = providerName;
			ProviderLogo = providerLogo;
			ID = id;
			Link = link;
		}
	}
}