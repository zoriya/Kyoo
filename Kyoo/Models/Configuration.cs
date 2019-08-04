namespace Kyoo.Models
{
    public class Configuration
    {
        public string DatabasePath { get; set; }

        public Configuration()
        {
            DatabasePath = @"C:\Projects\database.db";
        }
    }
}
