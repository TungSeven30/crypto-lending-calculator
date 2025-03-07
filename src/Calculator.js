import React, { useState } from 'react';
import './Calculator.css';

const Calculator = () => {
    const [collateralItems, setCollateralItems] = useState([]);
    const [debtAmount, setDebtAmount] = useState(0);

    const addCollateralItem = () => {
        setCollateralItems([...collateralItems, { asset: 'ETH', amount: 0, price: 0, ltv: 81 }]);
    };

    const removeCollateralItem = (index) => {
        const newItems = collateralItems.filter((_, i) => i !== index);
        setCollateralItems(newItems);
    };

    const handleInputChange = (index, field, value) => {
        const newItems = [...collateralItems];
        newItems[index][field] = value;
        setCollateralItems(newItems);
    };

    const calculateResults = () => {
        const WSTETH_TO_ETH = 1.1956;
        const collateralItems = document.querySelectorAll('.collateral-item');
        const debtAmount = parseFloat(document.getElementById('debtAmount').value) || 0;

        let totalCollateralValue = 0;
        let minLiquidationPrice = Infinity;
        let totalWeightedLTV = 0;
        let currentPrice = 0;

        collateralItems.forEach(item => {
            const asset = item.querySelector('.asset-select').value;
            const amount = parseFloat(item.querySelector('.amount-input').value) || 0;
            const price = parseFloat(item.querySelector('.price-input').value) || 0;
            const ltv = parseFloat(item.querySelector('.ltv-select').value) || 0;

            currentPrice = price; // Store current price for buffer calculation
            const value = amount * price;
            totalCollateralValue += value;
            totalWeightedLTV += (value * ltv);

            // Calculate individual liquidation price
            if (amount > 0) {
                const liquidationPrice = (debtAmount / amount) * (100 / ltv);
                if (liquidationPrice < minLiquidationPrice) {
                    minLiquidationPrice = liquidationPrice;
                }
            }
        });

        if (minLiquidationPrice === Infinity || totalCollateralValue === 0) {
            const resultDiv = document.getElementById('result');
            resultDiv.style.backgroundColor = '#ffebee';
            resultDiv.style.color = '#c62828';
            resultDiv.textContent = 'Please enter valid collateral and debt values';
            return;
        }

        const averageLTV = totalCollateralValue > 0 ? totalWeightedLTV / totalCollateralValue : 0;
        const currentRatio = totalCollateralValue > 0 ? (debtAmount / totalCollateralValue) * 100 : 0;
        const buffer = currentPrice > 0 ? ((currentPrice - minLiquidationPrice) / currentPrice) * 100 : 0;

        // Update display
        document.getElementById('totalCollateralValue').textContent = `$${formatNumber(totalCollateralValue)}`;
        document.getElementById('totalDebtValue').textContent = `$${formatNumber(debtAmount)}`;
        document.getElementById('currentRatio').textContent = `${formatNumber(currentRatio)}%`;
        document.getElementById('ratioFill').style.width = `${Math.min(currentRatio, 100)}%`;

        // Determine risk level
        let riskLevel, backgroundColor, textColor;
        if (buffer < 10) {
            riskLevel = 'HIGH RISK';
            backgroundColor = '#ff44444a';
            textColor = '#ff4444';
        } else if (buffer < 25) {
            riskLevel = 'MEDIUM RISK';
            backgroundColor = '#ff980044';
            textColor = '#ff9800';
        } else {
            riskLevel = 'LOW RISK';
            backgroundColor = '#4caf5044';
            textColor = '#4caf50';
        }

        // Display results
        const wstethPrice = minLiquidationPrice;
        const ethPrice = wstethPrice / WSTETH_TO_ETH;
        const resultDiv = document.getElementById('result');
        resultDiv.style.backgroundColor = backgroundColor;
        resultDiv.style.color = textColor;
        resultDiv.innerHTML = `
            <div class="result-grid">
                <div class="result-item">
                    <div class="label">Average Liquidation Threshold</div>
                    <div class="value">${formatNumber(averageLTV)}%</div>
                </div>
                <div class="result-item">
                    <div class="label">LTV</div>
                    <div class="value">${formatNumber(currentRatio)}%</div>
                </div>
                <div class="result-item">
                    <div class="label">Price Buffer</div>
                    <div class="value">${formatNumber(buffer)}%</div>
                </div>
                <div class="result-item">
                    <div class="label">Risk Level</div>
                    <div class="value">${riskLevel}</div>
                </div>
                <div class="result-item liquidation-price">
                    <div class="label">Liquidation Price:</div>
                    <div class="price-item">
                        <div>wstETH: $${formatNumber(wstethPrice)}</div>
                        <div>ETH: $${formatNumber(ethPrice)}</div>
                    </div>
                </div>
            </div>
        `;
    };

    function formatNumber(number, decimals = 2, currency = '') {
        // Handle large numbers with commas
        const parts = number.toFixed(decimals).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        // Add currency symbol if provided
        const formatted = parts.join('.');
        return currency ? `${currency}${formatted}` : formatted;
    }

    return (
        <div className="calculator">
            <div className="collateral-side">
                <h2>Collateral</h2>
                <div className="stats-grid">
                    <div className="stat-box">
                        <div>Total Value</div>
                        <div id="totalCollateralValue">$0.00</div>
                    </div>
                    <div className="stat-box">
                        <div>Net APR</div>
                        <div id="collateralNetApr">0.00%</div>
                    </div>
                </div>
                <div id="collateralContainer">
                    {collateralItems.map((item, index) => (
                        <div className="collateral-item" key={index}>
                            <button className="remove-collateral-btn" onClick={() => removeCollateralItem(index)}>×</button>
                            <label className="section-label">Collateral Asset</label>
                            <div className="input-group">
                                <label>Select Asset</label>
                                <select className="asset-select" value={item.asset} onChange={(e) => handleInputChange(index, 'asset', e.target.value)}>
                                    <option value="ETH">ETH</option>
                                    <option value="WSTETH">wstETH</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Token Amount</label>
                                <input type="number" className="amount-input" step="0.0001" placeholder="0.0" value={item.amount} onChange={(e) => handleInputChange(index, 'amount', parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="input-group">
                                <label>Token Price (USD)</label>
                                <input type="number" className="price-input" step="0.01" placeholder="0.00" value={item.price} onChange={(e) => handleInputChange(index, 'price', parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="input-group">
                                <label>Liquidation Threshold</label>
                                <select className="ltv-select" value={item.ltv} onChange={(e) => handleInputChange(index, 'ltv', parseFloat(e.target.value) || 0)}>
                                    <option value="81">81%</option>
                                    <option value="83">83%</option>
                                    <option value="88">88%</option>
                                    <option value="92">92%</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
                <button className="add-collateral-btn" onClick={addCollateralItem}>+ Add Collateral</button>
            </div>

            <div className="debt-side">
                <h2>Debt</h2>
                <div className="stats-grid">
                    <div className="stat-box">
                        <div>Total Debt</div>
                        <div id="totalDebtValue">$0.00</div>
                    </div>
                    <div className="stat-box">
                        <div>Net APR</div>
                        <div id="debtNetApr">0.00%</div>
                    </div>
                </div>
                <label className="section-label">USDT Debt Amount</label>
                <input type="number" id="debtAmount" step="0.01" value={debtAmount} onChange={(e) => setDebtAmount(parseFloat(e.target.value) || 0)} />
                <div className="ratio-container">
                    <div>Current Ratio: <span id="currentRatio">0%</span></div>
                    <div className="ratio-bar">
                        <div className="ratio-fill" id="ratioFill"></div>
                    </div>
                </div>
                <button id="calculateBtn" className="calculate-btn" onClick={calculateResults}>Calculate</button>
                <div id="result" style={{ marginTop: '15px', padding: '10px', borderRadius: '4px' }}></div>
            </div>
        </div>
    );
};

export default Calculator; 