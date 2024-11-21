$(document).ready(function() {
    const tableBody = $("#data-table tbody");
    let supplierData = [];
    let clusterData = []; // New variable to store cluster data

    // Function to load and parse the XLSX file for supplier data
    function loadSupplierData(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Assuming the supplier data is in the first sheet
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            supplierData = XLSX.utils.sheet_to_json(firstSheet);  // Parse the Excel sheet into JSON
        };
        reader.readAsArrayBuffer(file);
    }

    // Function to load and parse the CSV file for cluster data
    function loadClusterData() {
        Papa.parse("../CD_with_clusters_and_ranking.csv", {
            download: true,
            header: true,
            complete: function(results) {
                clusterData = results.data; // Parse the CSV file into JSON for cluster data
            }
        });
    }

    // Load Supplier_KPI_Dashboard.xlsx and CD_with_clusters_and_ranking.csv
    $.ajax({
        url: "../Supplier_KPI_Dashboard.xlsx",
        xhrFields: { responseType: 'blob' }, // This makes sure the file is handled as binary
        success: function(data) {
            loadSupplierData(data);  // Parse the supplier Excel file
        }
    });
    loadClusterData();  // Load the cluster data CSV

    // Use PapaParse to load and parse Test Data CSV
    Papa.parse("../Test Data.csv", {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data;

            // Populate table rows with CSV data, skipping any undefined rows
            data.forEach(item => {
                let subActivity = item['Sub - Activity'] ? item['Sub - Activity'] : 'Blank'; // Replace empty sub-activities with 'Blank'
                
                tableBody.append(`
                    <tr data-id="${item['Purch.Doc.']}" data-activity="${item['Activity']}" data-subactivity="${subActivity}" data-supplier="${item['Supplier/Supplying Plant']}">
                        <td>${item['Purch.Doc.']}</td>
                        <td>${item['Plnt']}</td>
                        <td>${item['PGr']}</td>
                        <td>${item['Supplier/Supplying Plant']}</td>
                        <td>${item['POrg']}</td>
                        <td>${item['Material']}</td>
                        <td>${item['Short Text']}</td>
                        <td>${item['PO Item Text']}</td>
                        <td>${item['Requisnr.']}</td>
                        <td>${item['Cost Ctr']}</td>
                        <td>${item['AgreementNumber']}</td>
                        <td>${item['Doc. Date']}</td>
                        <td>${item['Deliv.date']}</td>
                        <td>${item['Net Price']}</td>
                        <td>${item['Activity']}</td>
                        <td>${item['Classified Activity']}</td>
                        <td>${subActivity}</td>
                        <td>${item['Classified Sub - Activity']}</td>
                        <td><button class="btn-view">View</button></td>
                        <td>New</td>
                        <td>R&D</td>
                        <td><a href="#" class="link-action">Move to Pending</a></td>
                    </tr>
                `);
            });

            // Initialize DataTables with sorting enabled
            $('#data-table').DataTable({
                paging: false,  // Disable pagination
                scrollX: true,  // Enable horizontal scrolling
                searching: true,  // Keep the search functionality
                destroy: true,  // Destroy any previous initialization to prevent conflicts
                order: [] // Enable sorting for all headers
            });

            // Move search bar to the correct container
            $('.dataTables_filter').appendTo('.container-header');

            // Row click event to display insights
            $('#data-table tbody').on('click', 'tr', function() {
                const activity = $(this).data('activity');
                const subActivity = $(this).data('subactivity') || 'Blank'; // Handle blank sub-activities as "Blank"
                const supplier = $(this).data('supplier');

                // Find all rows for the selected activity and sub-activity
                const filteredSupplierData = supplierData.filter(item => 
                    item.Activity === activity && 
                    item.Sub_Activity === subActivity
                );

                // Generate table rows for all suppliers within the same activity and sub-activity
                let activityTableRows = filteredSupplierData.map(item => {
                    const highlightClass = item.Supplier === supplier ? 'table-row-highlight' : '';  // Use the CSS class to highlight the clicked row
                    return `
                        <tr class="${highlightClass}">
                            <td>${item.Activity}</td>
                            <td>${item.Sub_Activity}</td>
                            <td>${item.Supplier}</td>
                            <td>${item.Doc_Volume}</td>
                            <td>${item.Rank_Doc_Volume}</td>
                            <td>${item.Net_Price}</td>
                            <td>${item.Rank_Net_Price}</td>
                            <td>${item.Delivery_Time}</td>
                            <td>${item.Rank_Delivery_Time}</td>
                            <td>${item.Overall_Rank}</td> <!-- Display Overall Rank -->
                        </tr>
                    `;
                }).join('');

                // Find the cluster number of the selected supplier from the cluster data
                const selectedCluster = clusterData.find(item => 
                    item.Supplier === supplier && item.Activity === activity && item.Sub_Activity === subActivity
                )?.Agglomerative_Cluster;

                // Find all suppliers in the same cluster, activity, and sub-activity
                const similarSuppliers = clusterData.filter(item => 
                    item.Agglomerative_Cluster === selectedCluster && 
                    item.Activity === activity && 
                    item.Sub_Activity === subActivity
                );

                // Generate rows for the semantically similar suppliers
                let similarSupplierRows = similarSuppliers.map(item => `
                    <tr>
                        <td>${item.Supplier}</td>
                        <td>${item.Doc_Volume}</td>
                        <td>${item.Net_Price}</td>
                        <td>${item.Delivery_Time}</td>
                        <td>${item.Rank_Doc_Volume}</td>
                        <td>${item.Rank_Net_Price}</td>
                        <td>${item.Rank_Delivery_Time}</td>
                        <td>${item.Overall_Rank_By_Cluster}</td> <!-- Update to use Overall_Rank_By_Cluster -->
                        <td>${item.Agglomerative_Cluster}</td> <!-- Cluster Column -->
                    </tr>
                `).join('');


                // Complete table structure with scrollable container
                const activityTable = `
                    <div class="insight-table-wrapper" style="max-height: 300px; overflow-y: auto;">
                        <table class="table table-hover table-bordered" id="insights-table">
                            <thead>
                                <tr>
                                    <th>Activity</th>
                                    <th>Sub-Activity</th>
                                    <th>Supplier</th>
                                    <th>Purchase Volume</th>
                                    <th>Rank Volume</th>
                                    <th>Net Price</th>
                                    <th>Rank Price</th>
                                    <th>Avg Delivery Time</th>
                                    <th>Rank Delivery Time</th>
                                    <th>Overall Rank</th> <!-- Add Overall Rank to table header -->
                                </tr>
                            </thead>
                            <tbody>
                                ${activityTableRows} <!-- Insert all rows here -->
                            </tbody>
                        </table>
                    </div>
                `;

                // Summary bullet points for the supplier's ranking
                const summary = `
                    <ul class="ranking-summary">
                        <li><strong>Overall Rank:</strong> ${filteredSupplierData.length > 0 ? filteredSupplierData[0].Overall_Rank : 'N/A'}</li>
                        <li><strong>Rank by Document Volume:</strong> ${filteredSupplierData.length > 0 ? filteredSupplierData[0].Rank_Doc_Volume : 'N/A'}</li>
                        <li><strong>Rank by Net Price:</strong> ${filteredSupplierData.length > 0 ? filteredSupplierData[0].Rank_Net_Price : 'N/A'}</li>
                        <li><strong>Rank by Delivery Time:</strong> ${filteredSupplierData.length > 0 ? filteredSupplierData[0].Rank_Delivery_Time : 'N/A'}</li>
                    </ul>
                `;

                // Semantically similar suppliers table with a title
                const similarSuppliersTable = `
                    <div class="semantically-similar-table-wrapper" style="max-height: 300px; overflow-y: auto;">
                        <h4 class="sem-similar-title">Semantically Similar Suppliers</h4> <!-- Sticky title with class applied -->
                        <table class="table table-hover table-bordered" id="similar-suppliers-table">
                            <thead>
                                <tr>
                                    <th>Supplier</th>
                                    <th>Doc Volume</th>
                                    <th>Net Price</th>
                                    <th>Delivery Time</th>
                                    <th>Rank Doc Volume</th>
                                    <th>Rank Net Price</th>
                                    <th>Rank Delivery Time</th>
                                    <th>Overall Rank</th>
                                    <th>Cluster</th> <!-- Cluster Column -->
                                </tr>
                            </thead>
                            <tbody>
                                ${similarSupplierRows} <!-- Insert rows of similar suppliers here -->
                            </tbody>
                        </table>
                    </div>
                `;

                // Summary for semantically similar suppliers
                const similarSuppliersSummary = `
                <div class="ranking-summary-container">
                    <h4>Summary of Similar Suppliers Rankings:</h4>
                    <ul class="ranking-summary">
                        <li><strong>Overall Rank (By Cluster):</strong> ${similarSuppliers.length > 0 ? similarSuppliers[0].Overall_Rank_By_Cluster : 'N/A'}</li>
                        <li><strong>Rank by Document Volume:</strong> ${similarSuppliers.length > 0 ? similarSuppliers[0].Rank_Doc_Volume : 'N/A'}</li>
                        <li><strong>Rank by Net Price:</strong> ${similarSuppliers.length > 0 ? similarSuppliers[0].Rank_Net_Price : 'N/A'}</li>
                        <li><strong>Rank by Delivery Time:</strong> ${similarSuppliers.length > 0 ? similarSuppliers[0].Rank_Delivery_Time : 'N/A'}</li>
                        <li><strong>Cluster:</strong> ${selectedCluster || 'N/A'}</li> <!-- Display Cluster -->
                    </ul>
                </div>
            `;


                // Display insights content with clickable bullet points for Supplier, Activity, and Sub-Activity
                $('#insight-frame').html(`
                    <div class="insight-content">
                        <h3>Activity: ${activity}, Sub-Activity: ${subActivity}, Supplier: ${supplier}</h3>
                        <ul>
                            <li><strong>Supplier:</strong> <a href="#" class="clickable" data-type="supplier">${supplier}</a></li>
                            <li><strong>Activity:</strong> <a href="#" class="clickable" data-type="activity">${activity}</a></li>
                            <li><strong>Sub-Activity:</strong> <a href="#" class="clickable" data-type="subactivity">${subActivity || 'None'}</a></li>
                            <li><strong>Overall Rank:</strong> ${similarSuppliers.length > 0 ? similarSuppliers[0].Overall_Rank_By_Cluster : 'N/A'}</li> <!-- Display Overall Rank -->
                            <li><strong>Purchase Volume:</strong> ${filteredSupplierData.length > 0 ? filteredSupplierData[0].Doc_Volume : 'N/A'}</li>
                            <li><strong>Net Price:</strong> ${filteredSupplierData.length > 0 ? filteredSupplierData[0].Net_Price : 'N/A'}</li>
                            <li><strong>Avg Delivery Time:</strong> ${filteredSupplierData.length > 0 ? filteredSupplierData[0].Delivery_Time : 'N/A'}</li>
                        </ul>
                        <h4 class="sem-similar-title">Ranking within ${activity}: ${subActivity || 'None'}</h4>
                        ${activityTable} <!-- Insert dynamically generated table here -->
                        <div class="ranking-summary-container">
                            <h4>Summary of Rankings:</h4>
                            ${summary} <!-- Insert dynamically generated ranking summary -->
                        </div>
                        ${similarSuppliersTable} <!-- Insert dynamically generated similar suppliers table -->
                        ${similarSuppliersSummary} <!-- Insert bullet points for the similar suppliers -->
                    </div>
                `).removeClass('d-none');

                // Initialize DataTables for the insights table with sorting
                $('#insights-table').DataTable({
                    paging: false,  // Disable pagination
                    searching: false,  // Disable search functionality
                    order: [] // Enable sorting for all headers
                });

                // Initialize DataTables for the similar suppliers table with sorting
                $('#similar-suppliers-table').DataTable({
                    paging: false,  // Disable pagination
                    searching: false,  // Disable search functionality
                    order: [] // Enable sorting for all headers
                });
            });

            // Handle click events for Supplier, Activity, and Sub-Activity in the bullet points
            $(document).on('click', 'a.clickable', function(e) {
                e.preventDefault();
                const type = $(this).data('type');
                const value = $(this).text();

                // Update the heading of the new display frame
                $('#display-frame').html(`
                    <h3>${type.charAt(0).toUpperCase() + type.slice(1)}: ${value}</h3>
                    <p>Here we will display additional information about the ${type} ${value}.</p>
                `).removeClass('d-none');
            });
        }
    });


});
