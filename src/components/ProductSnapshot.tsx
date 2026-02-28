import React from 'react'
import '../styles/ProductSnapshot.css'

interface ProductSnapshotProps {
    productName: string
    priceRange: string
    alternatives: string[]
}

const ProductSnapshot: React.FC<ProductSnapshotProps> = ({ productName, priceRange, alternatives }) => {
    return (
        <div className="o-section o-product-snapshot">
            <h3 className="o-section-title">📦 Product Snapshot</h3>
            <div className="o-section-content">
                <div className="o-snapshot-item">
                    <div className="o-snapshot-label">Product Name</div>
                    <div className="o-snapshot-value o-product-name">{productName}</div>
                </div>

                {priceRange && (
                    <div className="o-snapshot-item">
                        <div className="o-snapshot-label">Price Range</div>
                        <div className="o-snapshot-value">{priceRange}</div>
                    </div>
                )}

                {alternatives && alternatives.length > 0 && (
                    <div className="o-snapshot-item">
                        <div className="o-snapshot-label">Product Alternatives</div>
                        <div className="o-snapshot-alternatives">
                            {alternatives.map((alt, idx) => (
                                <div key={idx} className="o-alternative-item">
                                    {alt}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ProductSnapshot
